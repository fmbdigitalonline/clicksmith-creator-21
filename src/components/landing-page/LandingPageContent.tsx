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
import LoadingStateLandingPage from "./LoadingStateLandingPage";

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
  const sectionOrder = landingPage?.section_order || defaultSectionOrder;

  const getBusinessDescription = (businessIdea: any): string => {
    if (typeof businessIdea === 'string') return businessIdea;
    if (businessIdea?.description) return businessIdea.description;
    if (businessIdea?.valueProposition) return businessIdea.valueProposition;
    return '';
  };

  const getTargetAudienceDescription = (targetAudience: any): string => {
    if (typeof targetAudience === 'string') return targetAudience;
    if (targetAudience?.description) return targetAudience.description;
    if (targetAudience?.icp) return targetAudience.icp;
    return '';
  };

  const renderSection = (sectionKey: string) => {
    const sectionData = currentContent[sectionKey];
    if (!sectionData || !sectionData.content) return null;

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

  const generateLandingPageTitle = (businessName: string, businessIdea: string): string => {
    const keywords = businessIdea.toLowerCase().split(' ');
    
    // Extract meaningful words
    const meaningfulWords = keywords.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'for', 'that', 'with'].includes(word)
    );
    
    // Get industry or key term from business idea
    const keyTerm = meaningfulWords[0] || businessName;
    
    // Creative title formats
    const titleFormats = [
      `${businessName} - Innovating ${keyTerm}`,
      `${businessName} | Future of ${keyTerm}`,
      `Transform Your ${keyTerm} - ${businessName}`,
      `${businessName} - Revolutionary ${keyTerm} Solutions`,
      `Next-Gen ${keyTerm} by ${businessName}`,
    ];
    
    // Select a random format
    return titleFormats[Math.floor(Math.random() * titleFormats.length)];
  };

  const generateLandingPageContent = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Transform the business idea and target audience data
      const businessDescription = getBusinessDescription(project.business_idea);
      const targetAudienceDescription = getTargetAudienceDescription(project.target_audience);

      // Log the transformed data
      console.log('Sending to edge function:', {
        projectId: project.id,
        businessName: project.name,
        businessDescription,
        targetAudienceDescription,
        templateStructure: template?.structure
      });

      // Generate creative title
      const pageTitle = generateLandingPageTitle(project.name || 'Project', businessDescription);

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

      if (!data || !data.content) {
        throw new Error('Invalid response from content generation');
      }

      // Log the successful response
      console.log('Generated content:', data);

      // Update landing page content in database
      const { error: updateError } = await supabase
        .from('landing_pages')
        .upsert({
          title: pageTitle,
          user_id: user.id,
          project_id: project.id,
          content: data.content,
          layout_style: data.layout_style,
          section_order: data.section_order || defaultSectionOrder,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      // Update local state
      setCurrentContent(data.content);
      setCurrentLayoutStyle(data.layout_style);

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
              onClick={() => generateLandingPageContent()}
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
