
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
      // Use all available project data
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
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
        marketingCampaign: projectData.marketing_campaign,
        projectImages: savedImages
      });

      // Call the edge function to generate landing page content
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

      // Save the generated content to the landing_pages table
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
                content={landingPage?.how_it_works || currentContent.howItWorks}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <MarketAnalysisSection
                content={landingPage?.market_analysis || currentContent.marketAnalysis}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <ValuePropositionSection
                content={{
                  title: currentContent.valueProposition?.title || "Why Choose Us?",
                  cards: currentContent.valueProposition?.cards || []
                }}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <FeaturesSection
                content={{
                  title: currentContent.features?.title || "Key Features",
                  description: currentContent.features?.description,
                  items: currentContent.features?.items || []
                }}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <TestimonialsSection
                content={{
                  title: currentContent.testimonials?.title || "What Our Clients Say",
                  items: currentContent.testimonials?.items || []
                }}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <ObjectionsSection
                content={landingPage?.objections || currentContent.objections}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <FaqSection
                content={landingPage?.faq || currentContent.faq}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <CtaSection
                content={currentContent.cta || {
                  title: "Ready to Get Started?",
                  description: "Join us today and experience the difference.",
                  buttonText: "Get Started"
                }}
                className={template.structure.styles.spacing.sectionPadding}
              />
              <FooterSection
                content={landingPage?.footer_content || currentContent.footerContent}
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
  // Ensure we have the required objects, even if empty
  const businessIdea = project?.business_idea || {};
  const audienceAnalysis = project?.audience_analysis || {};
  const savedImages = project?.marketing_campaign?.saved_images || [];

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

  // Default features with fallback images
  const defaultFeatures = [
    {
      title: "Easy to Use",
      description: "Intuitive design for the best user experience",
      image: savedImages[0] || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
      icon: "🎯"
    },
    {
      title: "Reliable Service",
      description: "Consistent performance you can count on",
      image: savedImages[1] || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
      icon: "🎯"
    },
    {
      title: "Fast Support",
      description: "Quick assistance whenever you need help",
      image: savedImages[2] || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
      icon: "🎯"
    }
  ];

  return {
    hero: {
      title: businessIdea?.valueProposition || project.title || "Welcome to Our Platform",
      description: businessIdea?.description || "Discover the best solution for your needs",
      cta: "Get Started Now",
      // Hero section still uses generated image
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
    },
    howItWorks: {
      subheadline: "How It Works",
      steps: [
        {
          title: "Step 1",
          description: "Get started with our easy onboarding process"
        },
        {
          title: "Step 2",
          description: "Customize your experience to match your needs"
        },
        {
          title: "Step 3",
          description: "Enjoy the benefits of our solution"
        }
      ],
      valueReinforcement: "Start your journey with us today"
    },
    marketAnalysis: {
      context: "Understanding the Market",
      solution: "Our Innovative Solution",
      painPoints: [
        {
          title: "Challenge 1",
          description: "Common industry pain point"
        },
        {
          title: "Challenge 2",
          description: "Another market challenge"
        }
      ],
      features: Array.isArray(audienceAnalysis?.keyFeatures)
        ? audienceAnalysis.keyFeatures.map((feature: string, index: number) => ({
            title: feature.split(':')[0] || feature,
            description: feature.split(':')[1] || feature,
            image: savedImages[index % savedImages.length] || defaultFeatures[index % defaultFeatures.length].image
          }))
        : defaultFeatures,
      socialProof: {
        quote: "This solution has transformed our business operations",
        author: "John Smith",
        title: "CEO, Tech Company"
      }
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
      description: "Discover what makes us different",
      items: Array.isArray(audienceAnalysis?.keyFeatures)
        ? audienceAnalysis.keyFeatures.map((feature: string, index: number) => ({
            title: feature.split(':')[0] || feature,
            description: feature.split(':')[1] || feature,
            icon: "🎯",
            image: savedImages[index % savedImages.length] || defaultFeatures[index % defaultFeatures.length].image
          }))
        : defaultFeatures,
    },
    testimonials: {
      title: "What Our Clients Say",
      items: [{
        quote: "This solution has transformed how we operate. Highly recommended!",
        author: "John Smith",
        role: "Business Owner"
      },
      {
        quote: "The best decision we made for our business growth.",
        author: "Jane Doe",
        role: "Marketing Director"
      }],
    },
    objections: {
      subheadline: "Common Questions Answered",
      concerns: [
        {
          question: "Is this right for my business?",
          answer: "Our solution is designed to scale with businesses of all sizes"
        },
        {
          question: "What about implementation?",
          answer: "We provide full support throughout the implementation process"
        }
      ]
    },
    faq: {
      subheadline: "Frequently Asked Questions",
      questions: [
        {
          question: "How do I get started?",
          answer: "Getting started is easy - simply sign up and follow our guided onboarding process"
        },
        {
          question: "What support do you offer?",
          answer: "We offer 24/7 customer support through multiple channels"
        }
      ]
    },
    cta: {
      title: "Ready to Get Started?",
      description: "Join thousands of satisfied customers and transform your business today.",
      buttonText: "Start Now",
    },
    footerContent: {
      contact: "Contact us at: support@example.com",
      newsletter: "Subscribe to our newsletter for updates",
      copyright: `© ${new Date().getFullYear()} All rights reserved.`
    }
  };
};

export default LandingPageContent;
