
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

  const renderSection = (sectionKey: string) => {
    const sectionContentMap: SectionContentMap = {
      hero: { content: currentContent.hero, layout: currentLayout?.hero?.layout || template?.structure.sections.hero.layout },
      value_proposition: { content: { title: currentContent.valueProposition?.title, cards: currentContent.valueProposition?.cards } },
      features: { content: { title: currentContent.features?.title, description: currentContent.features?.description, items: currentContent.features?.items } },
      testimonials: { content: { title: currentContent.testimonials?.title, items: currentContent.testimonials?.items } },
      cta: { content: currentContent.cta },
      how_it_works: { content: landingPage?.how_it_works || currentContent.howItWorks },
      market_analysis: { content: landingPage?.market_analysis || currentContent.marketAnalysis },
      objections: { content: landingPage?.objections || currentContent.objections },
      faq: { content: landingPage?.faq || currentContent.faq },
      footer: { content: landingPage?.footer_content || currentContent.footerContent }
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
    
    toast({
      title: "Creating landing page",
      description: "Please wait while we generate your landing page...",
    });

    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project.id)
        .single();

      if (projectError) throw projectError;

      const { data: adFeedback } = await supabase
        .from('ad_feedback')
        .select('saved_images')
        .eq('project_id', project.id)
        .limit(1)
        .single();

      const savedImages = adFeedback?.saved_images || [];

      console.log("Calling generate-landing-page function with data:", {
        businessIdea: projectData.business_idea,
        targetAudience: projectData.target_audience,
        audienceAnalysis: projectData.audience_analysis,
        marketingCampaign: projectData.marketing_campaign,
        projectImages: savedImages
      });

      const { data: generatedContent, error } = await supabase.functions
        .invoke('generate-landing-page', {
          body: {
            businessIdea: projectData.business_idea,
            targetAudience: projectData.target_audience,
            audienceAnalysis: projectData.audience_analysis,
            marketingCampaign: projectData.marketing_campaign,
            projectImages: savedImages
          },
        });

      if (error) throw error;
      
      console.log("Generated content:", generatedContent);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No authenticated user found");

      const { data: updatedLandingPage, error: saveError } = await supabase
        .from('landing_pages')
        .upsert({
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
        })
        .select()
        .single();

      if (saveError) throw saveError;
      
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
        description: error instanceof Error ? error.message : "Failed to generate landing page content",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isTemplateLoading) {
    return <div>Loading template...</div>;
  }

  return (
    <div className="space-y-8">
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
