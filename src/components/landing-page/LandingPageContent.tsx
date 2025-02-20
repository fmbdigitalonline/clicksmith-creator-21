
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLandingPageTemplate } from "./hooks/useLandingPageTemplate";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import LoadingStateLandingPage from "./LoadingStateLandingPage";
import { Loader2 } from "lucide-react";
import { HeroSection } from "./components/HeroSection";
import { SocialProofSection } from "./components/SocialProofSection";
import { DynamicSection } from "./components/DynamicSection";
import { useNavigate } from "react-router-dom";

interface GenerationProgress {
  status: string;
  progress: number;
}

interface StepDetails {
  stage: 'started' | 'content_generated' | 'images_generated' | string;
  [key: string]: any;
}

interface GenerationLog {
  success: boolean;
  error_message?: string;
  status?: string;
  step_details?: StepDetails;
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
  const navigate = useNavigate();
  const { isLoading: isTemplateLoading } = useLandingPageTemplate();

  useEffect(() => {
    if ((isGenerating || isRefining) && project?.id) {
      const interval = setInterval(async () => {
        const { data: logs, error } = await supabase
          .from('landing_page_generation_logs')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching generation logs:', error);
          return;
        }

        if (logs) {
          const logData = logs as unknown as GenerationLog;
          
          if (logData.success) {
            setGenerationProgress({ status: "Success!", progress: 100 });
            clearInterval(interval);
          } else if (logData.error_message) {
            setGenerationProgress({ 
              status: `Error: ${logData.error_message}`, 
              progress: 0 
            });
            clearInterval(interval);
          } else {
            const stepDetails = logData.step_details;
            let progress = 0;

            if (stepDetails) {
              progress = stepDetails.stage === 'started' ? 25 :
                        stepDetails.stage === 'content_generated' ? 50 :
                        stepDetails.stage === 'images_generated' ? 75 : 0;
            }
            
            setGenerationProgress({ 
              status: `${logData.status?.replace(/_/g, ' ') || 'Processing'}...`, 
              progress 
            });
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isGenerating, isRefining, project?.id]);

  const generateLandingPageContent = async () => {
    setIsGenerating(true);
    setGenerationProgress({ status: "Starting generation...", progress: 0 });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase.functions.invoke('generate-landing-page', {
        body: {
          projectId: project.id,
          businessIdea: project.business_idea,
          targetAudience: project.target_audience,
          userId: user.id,
          iterationNumber: landingPage?.content_iterations || 1
        }
      });

      if (error) throw error;

      // Handle credit-related errors
      if (error?.status === 402) {
        toast({
          title: "Insufficient Credits",
          description: "Please upgrade your plan to generate more landing pages.",
          variant: "destructive"
        });
        navigate('/pricing');
        return;
      }

      if (data && data.content) {
        console.log("Received new content:", data);
        toast({
          title: "Content Generated",
          description: "Your landing page content has been updated."
        });

        // Invalidate credits query to refresh the display
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        queryClient.invalidateQueries({ queryKey: ['free_tier_usage'] });
        queryClient.invalidateQueries({ queryKey: ['landing-page', project.id] });
        window.location.reload();
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate landing page content",
        variant: "destructive"
      });
    } finally {
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
                  "Generate Content"
                )}
              </Button>
            </div>
          </div>

          {generationProgress.progress > 0 && generationProgress.progress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${generationProgress.progress}%` }}
              ></div>
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
