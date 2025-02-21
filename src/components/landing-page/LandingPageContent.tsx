
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLandingPageTemplate } from "./hooks/useLandingPageTemplate";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import LoadingStateLandingPage from "./LoadingStateLandingPage";
import { Loader2, RefreshCw } from "lucide-react";
import { HeroSection } from "./components/HeroSection";
import { SocialProofSection } from "./components/SocialProofSection";
import { DynamicSection } from "./components/DynamicSection";
import { Progress } from "@/components/ui/progress";

interface LandingPageSection {
  type: 'hero' | 'features' | 'social-proof';
  order: number;
  content: Record<string, unknown>;
}

interface GenerationMetadata {
  error?: string;
  status?: string;
  progress?: number;
}

interface SuccessResponse {
  success: true;
  sections: LandingPageSection[];
}

interface ErrorResponse {
  success: false;
  error: string;
}

type GenerationResponse = SuccessResponse | ErrorResponse;

interface GenerationProgress {
  status: string;
  progress: number;
}

// Type guard for generation metadata
function isGenerationMetadata(value: unknown): value is GenerationMetadata {
  return value !== null && typeof value === 'object';
}

// Type guard for error response
function isErrorResponse(response: GenerationResponse): response is ErrorResponse {
  return !response.success;
}

const LandingPageContent = ({ project, landingPage }: { project: any; landingPage: any }) => {
  const [activeView, setActiveView] = useState<"edit" | "preview">("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({ 
    status: "", 
    progress: 0 
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isLoading: isTemplateLoading } = useLandingPageTemplate();

  useEffect(() => {
    if (isGenerating && project?.id) {
      const interval = setInterval(async () => {
        const { data: page } = await supabase
          .from('landing_pages')
          .select('generation_status, generation_metadata')
          .eq('id', landingPage.id)
          .single();

        if (page) {
          switch (page.generation_status) {
            case 'completed':
              setGenerationProgress({ status: "Success!", progress: 100 });
              setIsGenerating(false);
              clearInterval(interval);
              queryClient.invalidateQueries({ queryKey: ['landing-page', project.id] });
              break;
            case 'failed':
              const metadata = page.generation_metadata;
              const errorMessage = isGenerationMetadata(metadata) && metadata.error 
                ? metadata.error 
                : 'Unknown error';
              setGenerationProgress({ 
                status: `Error: ${errorMessage}`, 
                progress: 0 
              });
              setIsGenerating(false);
              clearInterval(interval);
              break;
            case 'generating':
              setGenerationProgress({ 
                status: "Generating content...", 
                progress: 50 
              });
              break;
            default:
              setGenerationProgress({ 
                status: page.generation_status, 
                progress: 25 
              });
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isGenerating, project?.id, landingPage?.id, queryClient]);

  const generateLandingPageContent = async () => {
    setIsGenerating(true);
    setGenerationProgress({ status: "Starting generation...", progress: 0 });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Authentication required');
      }

      const { data, error: functionError } = await supabase.functions.invoke<GenerationResponse>('generate-landing-content', {
        body: {
          projectData: {
            business_idea: project.business_idea,
            target_audience: project.target_audience,
            audience_analysis: project.audience_analysis
          },
          landingPageId: landingPage.id
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to generate content');
      }

      if (!data) {
        throw new Error('No response data received');
      }

      if (isErrorResponse(data)) {
        throw new Error(data.error);
      }

      toast({
        title: "Content Generation Started",
        description: "Your landing page content is being generated. This may take a moment."
      });

      const checkInterval = setInterval(async () => {
        const { data: pageData } = await supabase
          .from('landing_pages')
          .select('generation_status, content')
          .eq('id', landingPage.id)
          .single();

        if (pageData?.generation_status === 'completed' && pageData?.content) {
          clearInterval(checkInterval);
          setIsGenerating(false);
          setGenerationProgress({ status: "Success!", progress: 100 });
          queryClient.invalidateQueries({ queryKey: ['landing-page', project.id] });
          
          toast({
            title: "Content Generated",
            description: "Your landing page content has been updated."
          });
        } else if (pageData?.generation_status === 'failed') {
          clearInterval(checkInterval);
          setIsGenerating(false);
          setGenerationProgress({ status: "", progress: 0 });
          
          toast({
            title: "Generation Failed",
            description: "Failed to generate landing page content. Please try again.",
            variant: "destructive"
          });
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (isGenerating) {
          setIsGenerating(false);
          setGenerationProgress({ status: "", progress: 0 });
          toast({
            title: "Generation Timeout",
            description: "The generation process took too long. Please try again.",
            variant: "destructive"
          });
        }
      }, 300000);

    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate landing page content",
        variant: "destructive"
      });
      setIsGenerating(false);
      setGenerationProgress({ status: "", progress: 0 });
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
            <div className="flex gap-2">
              <Button 
                onClick={generateLandingPageContent}
                disabled={isGenerating || isRefining}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {generationProgress.status}
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>
          </div>

          {generationProgress.progress > 0 && generationProgress.progress < 100 && (
            <div className="w-full space-y-2 mb-4">
              <Progress value={generationProgress.progress} />
              <p className="text-sm text-muted-foreground text-center">
                {generationProgress.status}
              </p>
            </div>
          )}
        </div>

        <TabsContent value="preview" className="mt-0">
          {landingPage?.content?.sections ? (
            <div className="divide-y divide-gray-200">
              {landingPage.content.sections
                .sort((a: any, b: any) => a.order - b.order)
                .map((section: any) => {
                  switch (section.type) {
                    case 'hero':
                      return <HeroSection key={section.type} content={section.content} />;
                    case 'social-proof':
                      return <SocialProofSection key={section.type} content={section.content} />;
                    default:
                      return <DynamicSection key={section.type} section={section} />;
                  }
                })}
            </div>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold mb-4">No Content Generated Yet</h2>
              <p className="text-gray-600 mb-8">Click the "Generate Content" button to create your landing page.</p>
            </div>
          )}
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
