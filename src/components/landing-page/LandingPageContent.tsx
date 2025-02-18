
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLandingPageTemplate } from "./hooks/useLandingPageTemplate";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { sectionComponents } from "./constants/sectionConfig";
import { generateInitialContent } from "./utils/contentUtils";
import type { LandingPageContentProps, SectionContentMap } from "./types/landingPageTypes";
import LoadingState from "@/components/steps/complete/LoadingState";
import LoadingStateLandingPage from "./LoadingStateLandingPage";

const LandingPageContent = ({ project, landingPage }: LandingPageContentProps) => {
  const [activeView, setActiveView] = useState<"edit" | "preview">("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentContent, setCurrentContent] = useState<SectionContentMap>(() => {
    if (landingPage?.content) {
      return {
        hero: { content: landingPage.content.hero, layout: "centered" as const },
        value_proposition: { content: landingPage.content.value_proposition, layout: "grid" as const },
        features: { content: landingPage.content.features, layout: "grid" as const },
        proof: { content: landingPage.content.proof, layout: "grid" as const },
        pricing: { content: landingPage.content.pricing, layout: "grid" as const },
        finalCta: { content: landingPage.content.finalCta, layout: "centered" as const },
        footer: { content: landingPage.content.footer, layout: "grid" as const }
      };
    }
    return generateInitialContent(project);
  });
  const [currentLayoutStyle, setCurrentLayoutStyle] = useState(landingPage?.layout_style);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: template, isLoading: isTemplateLoading } = useLandingPageTemplate();
  const currentLayout = currentLayoutStyle || (template?.structure?.sections || {});
  const sectionOrder = landingPage?.section_order || [
    "hero",
    "value_proposition",
    "features",
    "proof",
    "pricing",
    "finalCta",
    "footer"
  ];

  console.log("Current content:", currentContent);
  console.log("Landing page data:", landingPage);

  const renderSection = (sectionKey: string) => {
    const sectionData = currentContent[sectionKey];
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
      <Component
        key={sectionKey}
        content={sectionData.content}
        layout={sectionData.layout}
      />
    );
  };

  const generateLandingPageContent = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Transform business idea and target audience data
      const businessDescription = project.business_idea?.description || project.business_idea?.valueProposition || '';
      const targetAudienceDescription = project.target_audience?.description || project.target_audience?.coreMessage || '';

      const { data, error } = await supabase.functions.invoke('generate-landing-page', {
        body: {
          projectId: project.id,
          businessName: project.name,
          businessIdea: businessDescription,
          targetAudience: targetAudienceDescription,
          template: template?.structure,
          existingContent: currentContent,
          layoutStyle: currentLayoutStyle
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      // Map the generated content to the correct structure with proper typing
      const formattedContent: SectionContentMap = {
        hero: { content: data.hero, layout: "centered" as const },
        value_proposition: { content: data.valueProposition, layout: "grid" as const },
        features: { content: data.marketAnalysis?.features, layout: "grid" as const },
        proof: { content: data.testimonials, layout: "grid" as const },
        pricing: { content: data.pricing, layout: "grid" as const },
        finalCta: { content: data.finalCta, layout: "centered" as const },
        footer: { content: data.footer, layout: "grid" as const }
      };

      // Convert the content to a plain object for database storage
      const dbContent = Object.entries(formattedContent).reduce((acc, [key, value]) => {
        acc[key] = {
          content: value.content,
          layout: value.layout
        };
        return acc;
      }, {} as Record<string, any>);

      // Update landing page content in database
      const { error: updateError } = await supabase
        .from('landing_pages')
        .upsert({
          title: project.name || "Landing Page",
          content: dbContent,
          project_id: project.id,
          user_id: user.id,
          layout_style: currentLayoutStyle,
          section_order: sectionOrder,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      // Update local state with new content
      setCurrentContent(formattedContent);

      // Invalidate queries to refetch latest data
      await queryClient.invalidateQueries({
        queryKey: ['landing-page', project.id]
      });

      toast({
        title: "Content generated successfully",
        description: "Your landing page content has been updated.",
      });
    } catch (error: any) {
      console.error('Error generating landing page:', error);
      toast({
        title: "Error generating content",
        description: error.message || "Failed to generate landing page content",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
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
          <div className="space-y-8">
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
