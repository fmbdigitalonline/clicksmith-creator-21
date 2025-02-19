
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLandingPageTemplate } from "./hooks/useLandingPageTemplate";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { sectionComponents } from "./constants/sectionConfig";
import type { LandingPageContentProps, SectionContentMap } from "./types/landingPageTypes";
import LoadingStateLandingPage from "./LoadingStateLandingPage";
import { cn } from "@/lib/utils";

const LandingPageContent = ({ project, landingPage }: LandingPageContentProps) => {
  const [activeView, setActiveView] = useState<"edit" | "preview">("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Initialize currentContent directly from landingPage.content if it exists
  const [currentContent, setCurrentContent] = useState<SectionContentMap>(() => {
    if (landingPage?.content) {
      console.log("Using landing page content:", landingPage.content);
      return {
        hero: { content: landingPage.content.hero, layout: "centered" },
        value_proposition: { 
          content: landingPage.content.value_proposition, 
          layout: "grid" 
        },
        features: { content: landingPage.content.features, layout: "grid" },
        proof: { content: landingPage.content.proof, layout: "grid" },
        pricing: { content: landingPage.content.pricing, layout: "grid" },
        finalCta: { content: landingPage.content.finalCta, layout: "centered" },
        footer: { content: landingPage.content.footer, layout: "grid" }
      };
    }
    return {};
  });
  
  const [currentLayoutStyle, setCurrentLayoutStyle] = useState(landingPage?.layout_style);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: template, isLoading: isTemplateLoading } = useLandingPageTemplate();
  const currentLayout = currentLayoutStyle || (template?.structure?.sections || {});
  const sectionOrder = [
    "hero",
    "value_proposition",
    "features",
    "proof",
    "pricing",
    "finalCta",
    "footer"
  ];

  const generateLandingPageContent = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-landing-page', {
        body: {
          projectId: project.id,
          businessName: project.title,
          businessIdea: project.business_idea,
          targetAudience: project.target_audience
        }
      });

      if (error) {
        throw error;
      }

      if (data) {
        setCurrentContent({
          hero: { content: data.hero, layout: "centered" },
          value_proposition: { content: data.value_proposition, layout: "grid" },
          features: { content: data.features, layout: "grid" },
          proof: { content: data.proof, layout: "grid" },
          pricing: { content: data.pricing, layout: "grid" },
          finalCta: { content: data.finalCta, layout: "centered" },
          footer: { content: data.footer, layout: "grid" }
        });
        toast({
          title: "Content Generated",
          description: "Your landing page content has been updated."
        });
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: "Failed to generate landing page content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderSection = (sectionKey: string) => {
    const sectionData = currentContent[sectionKey];
    console.log(`Rendering section ${sectionKey}:`, sectionData);
    
    if (!sectionData?.content) {
      console.log(`No content for section: ${sectionKey}`);
      return null;
    }

    const Component = sectionComponents[sectionKey];
    if (!Component) {
      console.warn(`No component found for section: ${sectionKey}`);
      return null;
    }

    return (
      <div key={sectionKey} className={cn(
        "w-full",
        sectionKey === 'hero' && "bg-gradient-to-r from-blue-50 to-indigo-50",
        sectionKey === 'value_proposition' && "bg-white",
        sectionKey === 'features' && "bg-gray-50",
        sectionKey === 'proof' && "bg-white",
        sectionKey === 'pricing' && "bg-gray-50",
        sectionKey === 'finalCta' && "bg-gradient-to-r from-primary/10 to-accent/10",
        sectionKey === 'footer' && "bg-gray-900 text-white"
      )}>
        <Component
          content={sectionData.content}
          layout={sectionData.layout || "default"}
        />
      </div>
    );
  };

  if (isTemplateLoading) {
    return <LoadingStateLandingPage />;
  }

  return (
    <div className="min-h-screen">
      <Tabs value={activeView} onValueChange={(value: "edit" | "preview") => setActiveView(value)}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
            </TabsList>
            <Button 
              onClick={generateLandingPageContent}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Content"}
            </Button>
          </div>
        </div>

        <TabsContent value="preview" className="mt-0">
          <div className="divide-y divide-gray-200">
            {sectionOrder.map((sectionKey) => renderSection(sectionKey))}
          </div>
        </TabsContent>

        <TabsContent value="edit" className="mt-0">
          <div className="container mx-auto px-4 py-8">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Content Editor</h2>
              <p className="text-muted-foreground">
                Content editing features coming soon...
              </p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LandingPageContent;
