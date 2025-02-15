import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLandingPageTemplate } from "./hooks/useLandingPageTemplate";
import HeroSection from "./sections/HeroSection";
import ValuePropositionSection from "./sections/ValuePropositionSection";
import FeaturesSection from "./sections/FeaturesSection";
import TestimonialsSection from "./sections/TestimonialsSection";
import CtaSection from "./sections/CtaSection";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface LandingPageContentProps {
  project: any;
  landingPage: any;
}

const LandingPageContent = ({ project, landingPage }: LandingPageContentProps) => {
  const [activeView, setActiveView] = useState<"edit" | "preview">("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch the default template
  const { data: template, isLoading: isTemplateLoading } = useLandingPageTemplate();
  
  const content = landingPage?.content || generateInitialContent(project);

  const generateLandingPageContent = async () => {
    setIsGenerating(true);
    // Show loading toast
    toast({
      title: "Creating landing page",
      description: "Please wait while we generate your landing page...",
    });

    try {
      // Get the project data first
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('business_idea, target_audience, audience_analysis')
        .eq('id', project.id)
        .single();

      if (projectError) throw projectError;

      // Get any saved ad images
      const { data: adFeedback } = await supabase
        .from('ad_feedback')
        .select('saved_images')
        .eq('project_id', project.id)
        .limit(1)
        .single();

      const savedImages = adFeedback?.saved_images || [];

      // Call the edge function to generate landing page content
      const { data: generatedContent, error } = await supabase.functions
        .invoke('generate-landing-page', {
          body: {
            businessIdea: projectData.business_idea,
            targetAudience: projectData.target_audience,
            audienceAnalysis: projectData.audience_analysis,
            projectImages: savedImages
          },
        });

      if (error) throw error;

      // Save the generated content to the landing_pages table
      const { error: saveError } = await supabase
        .from('landing_pages')
        .upsert({
          project_id: project.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
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
          ]
        });

      if (saveError) throw saveError;

      // Invalidate the landing page query to trigger a refetch
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
          {template && content && (
            <div className="space-y-12">
              <HeroSection 
                content={content.hero}
                layout={template.structure.sections.hero.layout}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <ValuePropositionSection
                content={{
                  title: content.valueProposition?.title || "Why Choose Us?",
                  cards: content.valueProposition?.cards || []
                }}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <FeaturesSection
                content={{
                  title: content.features?.title || "Key Features",
                  description: content.features?.description,
                  items: content.features?.items || []
                }}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <TestimonialsSection
                content={{
                  title: content.testimonials?.title || "What Our Clients Say",
                  items: content.testimonials?.items || []
                }}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <CtaSection
                content={content.cta || {
                  title: "Ready to Get Started?",
                  description: "Join us today and experience the difference.",
                  buttonText: "Get Started"
                }}
                className={template.structure.styles.spacing.sectionPadding}
              />
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
  // Ensure we have the required objects, even if empty
  const businessIdea = project?.business_idea || {};
  const audienceAnalysis = project?.audience_analysis || {};

  // Default card data
  const defaultCards = [
    {
      icon: "✨",
      title: "Quality Product",
      description: "Experience superior quality in every aspect"
    },
    {
      icon: "🎯",
      title: "Expert Service",
      description: "Professional support when you need it"
    },
    {
      icon: "💫",
      title: "Great Value",
      description: "Competitive pricing for premium offerings"
    }
  ];

  // Default features
  const defaultFeatures = [
    {
      title: "Easy to Use",
      description: "Intuitive design for the best user experience"
    },
    {
      title: "Reliable Service",
      description: "Consistent performance you can count on"
    },
    {
      title: "Fast Support",
      description: "Quick assistance whenever you need help"
    }
  ];

  return {
    hero: {
      title: businessIdea?.valueProposition || project.title || "Welcome to Our Platform",
      description: businessIdea?.description || "Discover the best solution for your needs",
      cta: "Get Started Now",
    },
    valueProposition: {
      title: "Why Choose Us?",
      cards: Array.isArray(audienceAnalysis?.benefits) 
        ? audienceAnalysis.benefits.map((benefit: string) => ({
            icon: "✨",
            title: benefit.split(':')[0] || benefit,
            description: benefit.split(':')[1] || benefit,
          }))
        : defaultCards,
    },
    features: {
      title: "Key Features",
      items: Array.isArray(audienceAnalysis?.keyFeatures)
        ? audienceAnalysis.keyFeatures.map((feature: string) => ({
            title: feature.split(':')[0] || feature,
            description: feature.split(':')[1] || feature,
          }))
        : defaultFeatures,
    },
    testimonials: {
      title: "What Our Clients Say",
      items: [{
        quote: "This solution has transformed how we operate. Highly recommended!",
        author: "John Smith",
        role: "Business Owner"
      }],
    },
    cta: {
      title: "Ready to Get Started?",
      description: "Join thousands of satisfied customers and transform your business today.",
      buttonText: "Start Now",
    }
  };
};

export default LandingPageContent;
