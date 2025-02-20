import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLandingPageTemplate } from "./hooks/useLandingPageTemplate";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import LoadingStateLandingPage from "./LoadingStateLandingPage";
import { cn } from "@/lib/utils";
import { Loader2, RotateCw } from "lucide-react";

interface GenerationLog {
  api_status_code: number;
  cache_hit: boolean;
  created_at: string;
  error_message: string | null;
  generation_time: number;
  id: string;
  project_id: string;
  request_payload: any;
  response_payload: any;
  success: boolean;
  status: string;
  step_details: {
    stage: string;
    timestamp?: string;
  };
}

const LandingPageContent = ({ project, landingPage }: { project: any; landingPage: any }) => {
  const [activeView, setActiveView] = useState<"edit" | "preview">("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    status: string;
    progress: number;
  }>({ status: "", progress: 0 });
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

        const log = logs as unknown as GenerationLog;

        if (log) {
          if (log.success) {
            setGenerationProgress({ status: "Success!", progress: 100 });
            clearInterval(interval);
          } else if (log.error_message) {
            setGenerationProgress({ 
              status: `Error: ${log.error_message}`, 
              progress: 0 
            });
            clearInterval(interval);
          } else {
            const progress = log.step_details?.stage === 'started' ? 25 :
                           log.step_details?.stage === 'content_generated' ? 50 :
                           log.step_details?.stage === 'images_generated' ? 75 : 0;
            
            setGenerationProgress({ 
              status: `${log.status?.replace(/_/g, ' ') || 'Processing'}...`, 
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

      if (data && data.content) {
        console.log("Received new content:", data);
        toast({
          title: "Content Generated",
          description: "Your landing page content has been updated."
        });

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

  const renderDynamicSection = (section: any) => {
    if (!section) return null;

    const containerClass = cn(
      "w-full py-12 md:py-16",
      section.layout?.width === 'contained' && "container mx-auto px-4",
      section.layout?.width === 'narrow' && "max-w-4xl mx-auto px-4",
      section.layout?.spacing === 'compact' && "py-8 md:py-12",
      section.layout?.spacing === 'spacious' && "py-16 md:py-24",
      section.layout?.background === 'gradient' && "bg-gradient-to-r from-primary/10 to-secondary/10",
      section.style?.colorScheme === 'dark' && "bg-gray-900 text-white",
      section.style?.colorScheme === 'light' && "bg-white text-gray-900"
    );

    const contentClass = cn(
      "space-y-6",
      section.layout?.style === 'grid' && "grid grid-cols-1 md:grid-cols-3 gap-8",
      section.layout?.style === 'columns' && "columns-1 md:columns-2 gap-8",
      section.style?.textAlign === 'center' && "text-center",
      section.layout?.style === 'split' && "grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
    );

    return (
      <div key={section.type} className={containerClass}>
        <div className={contentClass}>
          {section.content?.title && (
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              {section.content.title}
            </h2>
          )}
          
          {section.content?.subtitle && (
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {section.content.subtitle}
            </p>
          )}
          
          {section.content?.description && (
            <p className="text-gray-600 dark:text-gray-300">
              {section.content.description}
            </p>
          )}
          
          {section.content?.items && (
            <div className={cn(
              "grid gap-6",
              section.layout?.style === 'grid' && "grid-cols-1 md:grid-cols-3",
              section.layout?.style === 'columns' && "columns-1 md:columns-2"
            )}>
              {section.content.items.map((item: any, index: number) => (
                <div key={index} className="space-y-3">
                  {item.title && <h3 className="text-xl font-semibold">{item.title}</h3>}
                  {item.description && <p className="text-gray-600 dark:text-gray-300">{item.description}</p>}
                </div>
              ))}
            </div>
          )}
          
          {(section.content?.primaryCta || section.content?.secondaryCta) && (
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              {section.content.primaryCta && (
                <Button size="lg">
                  {section.content.primaryCta.text}
                </Button>
              )}
              {section.content.secondaryCta && (
                <Button variant="outline" size="lg">
                  {section.content.secondaryCta.text}
                </Button>
              )}
            </div>
          )}
        </div>
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
          {landingPage?.content?.sections ? (
            <div className="divide-y divide-gray-200">
              {landingPage.content.sections
                .sort((a: any, b: any) => a.order - b.order)
                .map((section: any) => renderDynamicSection(section))}
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
