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
  const [generationProgress, setGenerationProgress<{
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

  const renderParagraphs = (paragraphs: any[]) => {
    if (!paragraphs?.length) return null;

    return (
      <div className="space-y-6">
        {paragraphs.map((paragraph, index) => (
          <div key={index} className="space-y-2">
            {paragraph.heading && (
              <h3 className="text-xl font-semibold">{paragraph.heading}</h3>
            )}
            <p className={cn(
              "text-gray-600 dark:text-gray-300 leading-relaxed",
              paragraph.emphasis && "font-medium text-gray-900 dark:text-white"
            )}>
              {paragraph.text}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const renderBulletPoints = (points: string[]) => {
    if (!points?.length) return null;

    return (
      <ul className="space-y-2 list-disc list-inside text-gray-600 dark:text-gray-300">
        {points.map((point, index) => (
          <li key={index} className="leading-relaxed">{point}</li>
        ))}
      </ul>
    );
  };

  const renderItems = (items: any[], layout: any) => {
    if (!items?.length) return null;

    return (
      <div className={cn(
        "grid gap-6",
        layout?.style === 'grid' && "grid-cols-1 md:grid-cols-3",
        layout?.style === 'columns' && "columns-1 md:columns-2"
      )}>
        {items.map((item, index) => (
          <div key={index} className="space-y-4">
            <h3 className="text-xl font-semibold">{item.title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
            {item.details && renderBulletPoints(item.details)}
            {item.highlights && (
              <div className="mt-4">
                {item.highlights.map((highlight: string, hIndex: number) => (
                  <span key={hIndex} className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm mr-2 mb-2">
                    {highlight}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
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
      "space-y-8",
      section.layout?.style === 'grid' && "grid grid-cols-1 md:grid-cols-3 gap-8",
      section.layout?.style === 'columns' && "columns-1 md:columns-2 gap-8",
      section.style?.textAlign === 'center' && "text-center",
      section.layout?.style === 'split' && "grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
    );

    const headingClass = cn(
      "font-bold leading-tight",
      section.style?.typography?.headingSize === 'large' && "text-4xl md:text-5xl",
      section.style?.typography?.headingSize === 'xlarge' && "text-5xl md:text-6xl",
      "text-3xl md:text-4xl"
    );

    const bodyClass = cn(
      "leading-relaxed",
      section.style?.typography?.bodySize === 'large' && "text-lg",
      section.style?.typography?.lineHeight === 'relaxed' && "leading-relaxed",
      section.style?.typography?.lineHeight === 'loose' && "leading-loose"
    );

    return (
      <div key={section.type} className={containerClass}>
        <div className={contentClass}>
          {section.content?.title && (
            <h2 className={headingClass}>{section.content.title}</h2>
          )}
          
          {section.content?.subtitle && (
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {section.content.subtitle}
            </p>
          )}
          
          {section.content?.mainDescription && (
            <p className={cn(bodyClass, "text-gray-600 dark:text-gray-300")}>
              {section.content.mainDescription}
            </p>
          )}

          {section.content?.detailedDescription && (
            <p className={cn(bodyClass, "text-gray-600 dark:text-gray-300")}>
              {section.content.detailedDescription}
            </p>
          )}

          {section.content?.summary && (
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {section.content.summary}
            </p>
          )}

          {section.content?.bulletPoints && renderBulletPoints(section.content.bulletPoints)}
          
          {section.content?.paragraphs && renderParagraphs(section.content.paragraphs)}
          
          {section.content?.items && renderItems(section.content.items, section.layout)}
          
          {(section.content?.primaryCta || section.content?.secondaryCta) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              {section.content.primaryCta && (
                <div className="text-center sm:text-left">
                  <Button size="lg" className="w-full sm:w-auto">
                    {section.content.primaryCta.text}
                  </Button>
                  {section.content.primaryCta.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {section.content.primaryCta.description}
                    </p>
                  )}
                </div>
              )}
              {section.content.secondaryCta && (
                <div className="text-center sm:text-left">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    {section.content.secondaryCta.text}
                  </Button>
                  {section.content.secondaryCta.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {section.content.secondaryCta.description}
                    </p>
                  )}
                </div>
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
