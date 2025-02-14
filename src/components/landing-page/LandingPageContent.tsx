
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLandingPageTemplate } from "./hooks/useLandingPageTemplate";
import HeroSection from "./sections/HeroSection";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LandingPageContentProps {
  project: any;
  landingPage: any;
}

const LandingPageContent = ({ project, landingPage }: LandingPageContentProps) => {
  const [activeView, setActiveView] = useState<"edit" | "preview">("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  // Fetch the default template
  const { data: template, isLoading: isTemplateLoading } = useLandingPageTemplate();
  
  const content = landingPage?.content || generateInitialContent(project);

  const generateLandingPageContent = async () => {
    setIsGenerating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No authenticated user found");

      // First, get the saved ad image
      const { data: adFeedback } = await supabase
        .from('ad_feedback')
        .select('saved_images')
        .eq('project_id', project.id)
        .limit(1)
        .single();

      const savedImageUrl = adFeedback?.saved_images?.[0];

      const { data, error } = await supabase.functions.invoke('generate-landing-page', {
        body: {
          businessIdea: project.business_idea,
          targetAudience: project.target_audience,
          audienceAnalysis: project.audience_analysis,
        },
      });

      if (error) throw error;

      // Add the saved image to the hero section
      const contentWithImage = {
        ...data,
        hero: {
          ...data.hero,
          image: savedImageUrl
        }
      };

      const { data: dbResponse, error: dbError } = await supabase
        .from('landing_pages')
        .upsert({
          project_id: project.id,
          content: contentWithImage,
          title: project.title || "Landing Page",
          user_id: userData.user.id,
          layout_style: data.layout,
          image_placements: data.imagePlacements
        });

      if (dbError) throw dbError;

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
          {template && (
            <div className="space-y-12">
              <HeroSection 
                content={content.hero}
                layout={template.structure.sections.hero.layout}
                className={template.structure.styles.spacing.sectionPadding}
              />
              {/* Additional sections will be implemented here */}
            </div>
          )}
        </TabsContent>
        <TabsContent value="edit" className="mt-6">
          <Card className="p-4">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(content, null, 2)}
            </pre>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const generateInitialContent = (project: any) => {
  const { business_idea, target_audience, audience_analysis } = project;
  
  return {
    hero: {
      title: business_idea?.valueProposition || project.title,
      description: business_idea?.description || "",
      cta: "Get Started Now",
    },
    valueProposition: {
      title: "Why Choose Us?",
      cards: audience_analysis?.benefits?.map((benefit: string) => ({
        icon: "✨",
        title: benefit.split(':')[0] || benefit,
        description: benefit.split(':')[1] || benefit,
      })) || [],
    },
    features: {
      title: "Key Features",
      items: audience_analysis?.keyFeatures?.map((feature: string) => ({
        title: feature.split(':')[0] || feature,
        description: feature.split(':')[1] || feature,
      })) || [],
    },
    proof: {
      testimonials: [],
      statistics: [],
      trustBadges: [],
    },
    pricing: {
      title: "Simple Pricing",
      plans: [],
    },
    finalCta: {
      title: "Ready to Get Started?",
      subtitle: "Join thousands of satisfied customers and transform your business today.",
      buttonText: "Start Now",
    },
  };
};

export default LandingPageContent;
