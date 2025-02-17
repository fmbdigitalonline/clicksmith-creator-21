import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLandingPageTemplate } from "./hooks/useLandingPageTemplate";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { sectionComponents, defaultSectionOrder } from "./constants/sectionConfig";
import { generateInitialContent } from "./utils/contentUtils";
import type { LandingPageContentProps, SectionContentMap } from "./types/landingPageTypes";
import LoadingState from "@/components/steps/complete/LoadingState";

const LandingPageContent = ({ project, landingPage }: LandingPageContentProps) => {
  const [activeView, setActiveView] = useState<"edit" | "preview">("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentContent, setCurrentContent] = useState(landingPage?.content || generateInitialContent(project));
  const [currentLayoutStyle, setCurrentLayoutStyle] = useState(landingPage?.layout_style);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: template, isLoading: isTemplateLoading } = useLandingPageTemplate();
  const currentLayout = currentLayoutStyle || (template?.structure?.sections || {});
  const sectionOrder = landingPage?.section_order || defaultSectionOrder;

  const checkUserCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      const { data: results, error } = await supabase.rpc('check_user_credits', {
        p_user_id: user.id,
        required_credits: 1
      });

      if (error) throw error;

      // Get the first result from the array
      const result = results?.[0];
      if (!result || !result.has_credits) {
        toast({
          title: "Insufficient credits",
          description: result?.error_message || "Not enough credits available",
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking credits:', error);
      toast({
        title: "Error",
        description: "Failed to check credits availability",
        variant: "destructive",
      });
      return false;
    }
  };

  const deductCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      const { data: results, error } = await supabase.rpc('deduct_user_credits', {
        input_user_id: user.id,
        credits_to_deduct: 1
      });

      if (error) throw error;

      // Get the first result from the array
      const result = results?.[0];
      if (!result?.success) {
        throw new Error(result?.error_message || "Failed to deduct credits");
      }

      // Invalidate credits queries to refresh the display
      await queryClient.invalidateQueries({ queryKey: ['credits'] });
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      await queryClient.invalidateQueries({ queryKey: ['free_tier_usage'] });

    } catch (error) {
      console.error('Error deducting credits:', error);
      throw error;
    }
  };

  const renderSection = (sectionKey: string) => {
    const sectionContentMap: SectionContentMap = {
      hero: { 
        content: currentContent.hero, 
        layout: currentLayout?.hero?.layout || 'centered'
      },
      value_proposition: { 
        content: { title: currentContent.valueProposition?.title, cards: currentContent.valueProposition?.cards },
        layout: 'default'
      },
      features: { 
        content: { title: currentContent.features?.title, description: currentContent.features?.description, items: currentContent.features?.items },
        layout: 'default'
      },
      testimonials: { 
        content: { title: currentContent.testimonials?.title, items: currentContent.testimonials?.items },
        layout: 'default'
      },
      cta: { 
        content: currentContent.cta,
        layout: 'default'
      },
      how_it_works: { 
        content: landingPage?.how_it_works || currentContent.howItWorks,
        layout: 'default'
      },
      market_analysis: { 
        content: landingPage?.market_analysis || currentContent.marketAnalysis,
        layout: 'default'
      },
      objections: { 
        content: landingPage?.objections || currentContent.objections,
        layout: 'default'
      },
      faq: { 
        content: landingPage?.faq || currentContent.faq,
        layout: 'default'
      },
      footer: { 
        content: landingPage?.footer_content || currentContent.footerContent,
        layout: 'default'
      }
    };

    const SectionComponent = sectionComponents[sectionKey as keyof typeof sectionComponents];
    if (!SectionComponent) return null;

    const sectionProps = sectionContentMap[sectionKey];
    if (!sectionProps) return null;

    return (
      <SectionComponent
        key={sectionKey}
        {...sectionProps}
        className={template?.structure.styles.spacing.sectionPadding}
      />
    );
  };

  const generateLandingPageContent = async () => {
    setIsGenerating(true);
    console.log("Starting generation of new layout");
    
    try {
      // Check credits first
      const hasCredits = await checkUserCredits();
      if (!hasCredits) {
        setIsGenerating(false);
        return;
      }

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project.id)
        .single();

      if (projectError) {
        console.error('Project fetch error:', projectError);
        throw projectError;
      }

      // Changed from .single() to .maybeSingle() to handle no results gracefully
      const { data: adFeedback, error: adFeedbackError } = await supabase
        .from('ad_feedback')
        .select('saved_images')
        .eq('project_id', project.id)
        .limit(1)
        .maybeSingle();

      if (adFeedbackError && adFeedbackError.code !== 'PGRST116') {
        console.error('Ad feedback fetch error:', adFeedbackError);
        throw adFeedbackError;
      }

      // If no ad feedback exists, use an empty array
      const savedImages = adFeedback?.saved_images || [];

      const requestBody = {
        businessIdea: projectData.business_idea,
        targetAudience: projectData.target_audience,
        audienceAnalysis: projectData.audience_analysis,
        marketingCampaign: projectData.marketing_campaign,
        projectImages: savedImages
      };

      console.log("Calling generate-landing-page function with data:", requestBody);

      const { data: generatedContent, error: functionError } = await supabase.functions
        .invoke('generate-landing-page', {
          body: requestBody,
          headers: {
            'Content-Type': 'application/json'
          }
        });

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw new Error(`Landing page generation failed: ${functionError.message || 'Unknown error'}`);
      }

      if (!generatedContent) {
        throw new Error('No content generated from the function');
      }
      
      console.log("Generated content:", generatedContent);

      // Deduct credits after successful generation
      try {
        await deductCredits();
      } catch (creditError) {
        console.error('Credit deduction error:', creditError);
        throw creditError;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("No authenticated user found");
      }

      const landingPageData = {
        id: landingPage?.id,
        title: projectData.title || "Landing Page",
        project_id: project.id,
        user_id: userData.user.id,
        content: generatedContent,
        image_placements: generatedContent.imagePlacements,
        layout_style: generatedContent.layout,
        template_version: 2,
        section_order: [
          "hero",
          "value_proposition",
          "features",
          "proof",
          "pricing",
          "finalCta",
          "footer"
        ],
        conversion_goals: [
          "sign_up",
          "contact_form",
          "newsletter"
        ],
        how_it_works: generatedContent.howItWorks,
        market_analysis: generatedContent.marketAnalysis,
        objections: generatedContent.objections,
        faq: generatedContent.faq,
        footer_content: generatedContent.footerContent,
        styling: generatedContent.theme
      };

      const { data: updatedLandingPage, error: saveError } = await supabase
        .from('landing_pages')
        .upsert(landingPageData)
        .select()
        .single();

      if (saveError) {
        console.error('Landing page save error:', saveError);
        throw saveError;
      }
      
      console.log("Updated landing page:", updatedLandingPage);

      setCurrentContent(generatedContent);
      setCurrentLayoutStyle(generatedContent.layout);

      await queryClient.invalidateQueries({
        queryKey: ["landing-page", project.id]
      });

      toast({
        title: "Success",
        description: "Landing page content generated successfully!",
      });

    } catch (error) {
      console.error('Error generating landing page:', error);
      toast({
        title: "Error",
        description: error instanceof Error 
          ? `Generation failed: ${error.message}` 
          : "Failed to generate landing page content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      // Dismiss the loading toast
      toast({
        title: "Status",
        description: "Generation complete",
        duration: 2000,
      });
    }
  };

  return (
    <div className="space-y-8">
      {isGenerating && <LoadingState fullScreen />}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "edit" | "preview")}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>
          <Button 
            onClick={generateLandingPageContent}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate New Layout"}
          </Button>
        </div>
        <TabsContent value="preview" className="mt-6">
          {template && currentContent && (
            <div className="space-y-12">
              {sectionOrder.map((sectionKey) => renderSection(sectionKey))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="edit" className="mt-6">
          <Card className="p-4">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(currentContent, null, 2)}
            </pre>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LandingPageContent;
