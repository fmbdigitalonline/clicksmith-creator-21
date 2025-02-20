import { useState, useEffect, useCallback } from "react";
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

interface GenerationLog {
  status: string | null;
  success: boolean;
  error_message: string | null;
  step_details: {
    stage?: 'started' | 'content_generated' | 'images_generated' | 'completed' | 'failed';
    timestamp?: string;
  };
}

interface LandingPageSection {
  type: string;
  order?: number;
  content: any;
}

interface LandingPageResponse {
  content: {
    sections?: LandingPageSection[];
  };
  project_id: string;
  id: string;
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
    let intervalId: NodeJS.Timeout | undefined;

    const checkProgress = async () => {
      if (!project?.id || (!isGenerating && !isRefining)) return;

      try {
        const { data: logs, error } = await supabase
          .from('landing_page_generation_logs')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching generation logs:', error);
          return;
        }

        if (logs) {
          const generationLog = logs as GenerationLog;
          console.log('Generation log status:', generationLog.status, 'Step details:', generationLog.step_details);
          
          if (generationLog.success) {
            setGenerationProgress({ status: "Success!", progress: 100 });
            clearInterval(intervalId);
            setIsGenerating(false);
            setIsRefining(false);

            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['subscription'] }),
              queryClient.invalidateQueries({ queryKey: ['free_tier_usage'] }),
              queryClient.invalidateQueries({ queryKey: ['landing-page', project.id] })
            ]);

            // Force a refetch
            await queryClient.refetchQueries({ 
              queryKey: ['landing-page', project.id],
              type: 'active'
            });
          } else if (generationLog.error_message) {
            setGenerationProgress({ 
              status: `Error: ${generationLog.error_message}`, 
              progress: 0 
            });
            clearInterval(intervalId);
            setIsGenerating(false);
            setIsRefining(false);
          } else {
            const stepDetails = generationLog.step_details;
            let progress = 0;

            if (stepDetails && stepDetails.stage) {
              progress = 
                stepDetails.stage === 'started' ? 25 :
                stepDetails.stage === 'content_generated' ? 50 :
                stepDetails.stage === 'images_generated' ? 75 :
                stepDetails.stage === 'completed' ? 100 : 0;
            }
            
            setGenerationProgress({ 
              status: `${generationLog.status?.replace(/_/g, ' ') || 'Processing'}...`, 
              progress 
            });
          }
        }
      } catch (error) {
        console.error('Error in progress check:', error);
      }
    };

    if (isGenerating || isRefining) {
      void checkProgress();
      intervalId = setInterval(checkProgress, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isGenerating, isRefining, project?.id, queryClient]);

  const generateLandingPageContent = async () => {
    if (!project?.id) {
      toast({
        title: "Error",
        description: "No project found",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({ status: "Starting generation...", progress: 0 });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Authentication required');
      }

      console.log('Starting landing page generation for project:', project.id);

      const { data, error } = await supabase.functions.invoke('generate-landing-page', {
        body: {
          projectId: project.id,
          businessIdea: project.business_idea,
          targetAudience: project.target_audience,
          userId: user.id,
          iterationNumber: (landingPage?.content_iterations || 0) + 1
        }
      });

      if (error) {
        console.error('Generation error:', error);
        if (error.status === 402) {
          toast({
            title: "Insufficient Credits",
            description: "Please upgrade your plan to generate more landing pages.",
            variant: "destructive"
          });
          navigate('/pricing');
          return;
        }
        throw error;
      }

      console.log('Generated content:', data);

      if (!data || !data.content) {
        throw new Error('Invalid response from generation service');
      }

      if (data.project_id !== project.id) {
        console.error('Project ID mismatch:', { 
          expected: project.id, 
          received: data.project_id 
        });
        throw new Error('Generated content does not match the current project');
      }

      toast({
        title: "Content Generated",
        description: "Your landing page content has been updated."
      });

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

  const renderSections = () => {
    const sections = landingPage?.content?.sections;
    if (!Array.isArray(sections) || sections.length === 0) {
      return (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-4">No Content Generated Yet</h2>
          <p className="text-gray-600 mb-8">Click the "Generate Content" button to create your landing page.</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-200">
        {sections
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((section, index) => {
            console.log('Rendering section:', section);
            switch (section.type) {
              case 'hero':
                return <HeroSection key={`${section.type}-${index}`} content={section.content} />;
              case 'social-proof':
                return <SocialProofSection key={`${section.type}-${index}`} content={section.content} />;
              default:
                return <DynamicSection key={`${section.type}-${index}`} section={section} />;
            }
          })}
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
          {renderSections()}
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
