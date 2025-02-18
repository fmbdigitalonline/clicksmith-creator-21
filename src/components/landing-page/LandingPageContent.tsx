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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LandingPageContent = ({ project, landingPage }: LandingPageContentProps) => {
  const [activeView, setActiveView] = useState<"edit" | "preview">("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentContent, setCurrentContent] = useState<SectionContentMap>(
    landingPage?.content || generateInitialContent(project)
  );
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

  const formatProjectData = () => {
    const businessIdea = typeof project.business_idea === 'string' 
      ? { description: project.business_idea, valueProposition: project.business_idea }
      : project.business_idea || {};

    const targetAudience = typeof project.target_audience === 'string'
      ? { description: project.target_audience }
      : project.target_audience || {};

    const audienceAnalysis = typeof project.audience_analysis === 'string'
      ? { description: project.audience_analysis }
      : project.audience_analysis || {};

    return {
      projectId: project.id,
      businessName: project.name || project.title || "My Business",
      businessIdea,
      targetAudience,
      audienceAnalysis,
      marketingCampaign: project.marketing_campaign || {},
      selectedHooks: Array.isArray(project.selected_hooks) ? project.selected_hooks : [],
      generatedAds: Array.isArray(project.generated_ads) ? project.generated_ads : [],
      timestamp: new Date().toISOString()
    };
  };

  const generateLandingPageContent = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const payload = formatProjectData();
      console.log('Formatted payload for edge function:', payload);

      const { data, error } = await supabase.functions.invoke('generate-landing-page', {
        body: payload
      });

      if (error) throw error;
      if (!data) throw new Error('No content received from edge function');

      console.log('Received generated content:', data);

      setCurrentContent({
        hero: { content: data.hero, layout: "centered" },
        value_proposition: { content: data.value_proposition, layout: "grid" },
        features: { content: data.features, layout: "grid" },
        proof: { content: data.proof, layout: "grid" },
        pricing: { content: data.pricing, layout: "grid" },
        finalCta: { content: data.finalCta, layout: "centered" },
        footer: { content: data.footer, layout: "grid" }
      });

      const { error: updateError } = await supabase
        .from('landing_pages')
        .upsert({
          title: project.name || project.title || "Landing Page",
          content: currentContent,
          project_id: project.id,
          user_id: user.id,
          layout_style: currentLayoutStyle,
          section_order: sectionOrder,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

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

  if (isTemplateLoading) {
    return <LoadingStateLandingPage />;
  }

  return (
    <div className="min-h-screen">
      <Dialog open={isGenerating} modal>
        <DialogContent 
          className="sm:max-w-[425px]"
          aria-describedby="loading-description"
        >
          <DialogHeader>
            <DialogTitle>Generating Your Landing Page</DialogTitle>
            <DialogDescription id="loading-header-description">
              Please wait while we analyze your project data and generate a custom landing page.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
              aria-label="Loading indicator"
              role="progressbar"
            />
          </div>
          <DialogDescription id="loading-description">
            We're crafting unique content based on your business details. This may take a few moments.
          </DialogDescription>
        </DialogContent>
      </Dialog>

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
              aria-label={isGenerating ? "Generating content..." : "Generate content"}
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
