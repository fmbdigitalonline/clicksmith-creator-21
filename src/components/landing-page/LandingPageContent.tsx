
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
import HowItWorksSection from "./sections/HowItWorksSection";
import MarketAnalysisSection from "./sections/MarketAnalysisSection";
import ObjectionsSection from "./sections/ObjectionsSection";
import FaqSection from "./sections/FaqSection";
import FooterSection from "./sections/FooterSection";
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
  const [currentContent, setCurrentContent] = useState(landingPage?.content || generateInitialContent(project));
  const [currentLayoutStyle, setCurrentLayoutStyle] = useState(landingPage?.layout_style);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch the default template
  const { data: template, isLoading: isTemplateLoading } = useLandingPageTemplate();
  
  // Get the current layout from landingPage or template default
  const currentLayout = currentLayoutStyle || (template?.structure?.sections || {});

  const generateLandingPageContent = async () => {
    setIsGenerating(true);
    console.log("Starting generation of new layout");
    
    toast({
      title: "Creating landing page",
      description: "Please wait while we generate your landing page...",
    });

    try {
      // Get the project data first
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('business_idea, target_audience, audience_analysis, title')
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

      console.log("Calling generate-landing-page function with data:", {
        businessIdea: projectData.business_idea,
        targetAudience: projectData.target_audience,
        audienceAnalysis: projectData.audience_analysis,
        projectImages: savedImages
      });

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
      
      console.log("Generated content:", generatedContent);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No authenticated user found");

      // Save the generated content to the landing_pages table
      const { data: updatedLandingPage, error: saveError } = await supabase
        .from('landing_pages')
        .upsert({
          id: landingPage?.id, // Include existing ID if updating
          title: projectData.title || "Landing Page", // Add required title field
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
          ]
        })
        .select()
        .single();

      if (saveError) throw saveError;
      
      console.log("Updated landing page:", updatedLandingPage);

      // Update local state with new content
      setCurrentContent(generatedContent);
      setCurrentLayoutStyle(generatedContent.layout);

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
          {template && currentContent && (
            <div className="space-y-12">
              <HeroSection 
                content={currentContent.hero}
                layout={currentLayout?.hero?.layout || template.structure.sections.hero.layout}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <HowItWorksSection
                content={currentContent.howItWorks}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <MarketAnalysisSection
                content={currentContent.marketAnalysis}
                className={template.structure.styles.spacing.sectionPadding}
              />
              {currentContent.valueProposition && (
                <ValuePropositionSection
                  content={currentContent.valueProposition}
                  className={template.structure.styles.spacing.sectionPadding}
                />
              )}
              {currentContent.features && (
                <FeaturesSection
                  content={currentContent.features}
                  className={template.structure.styles.spacing.sectionPadding}
                />
              )}
              {currentContent.testimonials && (
                <TestimonialsSection
                  content={currentContent.testimonials}
                  className={template.structure.styles.spacing.sectionPadding}
                />
              )}
              <ObjectionsSection
                content={currentContent.objections}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <FaqSection
                content={currentContent.faq}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <CtaSection
                content={currentContent.cta}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <FooterSection
                content={currentContent.footerContent}
                className={template.structure.styles.spacing.sectionPadding}
              />
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

const generateInitialContent = (project: any) => {
  // Default content structure matching the AIDA framework
  return {
    hero: {
      title: project?.business_idea?.valueProposition || "Welcome",
      description: project?.business_idea?.description || "Discover our solution",
      cta: "Get Started",
    },
    howItWorks: {
      subheadline: "Simple steps to success",
      steps: [
        {
          title: "Step 1",
          description: "Get started with our solution"
        },
        {
          title: "Step 2",
          description: "Experience the benefits"
        }
      ],
      valueReinforcement: "Join us today and transform your business"
    },
    marketAnalysis: {
      context: "Understanding your needs",
      solution: "Our comprehensive solution",
      painPoints: [
        {
          title: "Challenge",
          description: "Common industry challenge"
        }
      ],
      features: [
        {
          title: "Feature",
          description: "Key benefit"
        }
      ],
      socialProof: {
        quote: "Great solution!",
        author: "John Doe",
        title: "Business Owner"
      }
    },
    objections: {
      subheadline: "Common concerns addressed",
      concerns: [
        {
          question: "Is this right for me?",
          answer: "Yes, here's why..."
        }
      ]
    },
    faq: {
      subheadline: "Frequently Asked Questions",
      questions: [
        {
          question: "How does it work?",
          answer: "It's simple..."
        }
      ]
    },
    footerContent: {
      contact: "Contact us at support@example.com",
      newsletter: "Stay updated with our latest news",
      copyright: "© 2024 All rights reserved"
    }
  };
};

export default LandingPageContent;
