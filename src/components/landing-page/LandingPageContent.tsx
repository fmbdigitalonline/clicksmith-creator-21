import { useState, useEffect } from "react";
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

const LandingPageContent = ({ project, landingPage }: LandingPageContentProps) => {
  const [activeView, setActiveView] = useState<"edit" | "preview">("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    status: string;
    progress: number;
  }>({ status: "", progress: 0 });
  const [currentLayoutStyle, setCurrentLayoutStyle] = useState(landingPage?.theme_settings || {});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: template, isLoading: isTemplateLoading } = useLandingPageTemplate();
  
  const [currentContent, setCurrentContent] = useState<SectionContentMap>(() => {
    if (landingPage?.content) {
      console.log("Initializing landing page content with:", landingPage.content);
      return {
        hero: { 
          content: landingPage.content.hero || {
            title: "Welcome",
            description: "Your landing page content is being generated.",
            ctaText: "Get Started"
          }, 
          layout: landingPage.theme_settings?.heroLayout || "centered" 
        },
        value_proposition: { 
          content: {
            title: "Why Choose Us",
            items: landingPage.content.features || []
          }, 
          layout: landingPage.theme_settings?.featuresLayout || "grid" 
        },
        features: { 
          content: {
            title: "Our Features",
            items: landingPage.content.benefits || []
          }, 
          layout: landingPage.theme_settings?.benefitsLayout || "grid" 
        },
        proof: { 
          content: {
            title: "Customer Testimonials",
            testimonials: landingPage.content.testimonials || []
          }, 
          layout: landingPage.theme_settings?.testimonialsLayout || "grid" 
        },
        pricing: { 
          content: {
            title: "Our Pricing",
            plans: [
              {
                name: "Starter",
                price: "Free",
                features: ["Basic features", "Community support", "Up to 1000 users"]
              },
              {
                name: "Pro",
                price: "$49/mo",
                features: ["All Starter features", "Priority support", "Unlimited users"]
              }
            ]
          }, 
          layout: landingPage.theme_settings?.pricingLayout || "grid" 
        },
        faq: {
          content: {
            title: "Frequently Asked Questions",
            items: landingPage.content.faq?.items || [
              {
                question: "How do I get started?",
                answer: "Getting started is easy! Simply sign up for an account and follow our quick setup guide."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, PayPal, and bank transfers."
              }
            ]
          },
          layout: "default"
        },
        finalCta: { 
          content: {
            title: landingPage.content.cta?.title || "Ready to Get Started?",
            description: landingPage.content.cta?.description || "Join us today and experience the difference.",
            ctaText: landingPage.content.cta?.buttonText || "Get Started Now"
          }, 
          layout: "centered" 
        },
        footer: { 
          content: {
            links: landingPage.content.footer || {
              company: ["About", "Contact", "Careers"],
              resources: ["Help Center", "Terms", "Privacy"]
            }
          }, 
          layout: "grid" 
        }
      };
    }
    
    // Return default content if no landing page content exists
    return {
      hero: { 
        content: {
          title: "Welcome",
          description: "Your landing page content is being generated.",
          ctaText: "Get Started"
        }, 
        layout: "centered" 
      },
      value_proposition: { 
        content: {
          title: "Why Choose Us",
          items: []
        }, 
        layout: "grid" 
      },
      features: { 
        content: {
          title: "Our Features",
          items: []
        }, 
        layout: "grid" 
      },
      proof: { 
        content: {
          title: "Customer Testimonials",
          testimonials: []
        }, 
        layout: "grid" 
      },
      pricing: { 
        content: {
          title: "Our Pricing",
          plans: []
        }, 
        layout: "grid" 
      },
      faq: {
        content: {
          title: "Frequently Asked Questions",
          items: []
        },
        layout: "default"
      },
      finalCta: { 
        content: {
          title: "Ready to Get Started?",
          description: "Join us today and experience the difference.",
          ctaText: "Get Started Now"
        }, 
        layout: "centered" 
      },
      footer: { 
        content: {
          links: {
            company: ["About", "Contact", "Careers"],
            resources: ["Help Center", "Terms", "Privacy"]
          }
        }, 
        layout: "grid" 
      }
    };
  });

  // Monitor generation progress
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

        const log = logs as GenerationLog;

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
      const { data, error } = await supabase.functions.invoke('generate-landing-page', {
        body: {
          projectId: project.id,
          businessName: project.title,
          businessIdea: project.business_idea,
          targetAudience: project.target_audience,
          iterationNumber: landingPage?.content_iterations || 1
        }
      });

      if (error) throw error;

      if (data) {
        console.log("Received new content:", data);
        
        // Save the current version before updating
        if (landingPage?.id) {
          const { error: updateError } = await supabase
            .from('landing_pages')
            .update({
              content_versions: [...(landingPage.content_versions || []), currentContent],
              current_version: (landingPage.current_version || 1) + 1,
              content_iterations: (landingPage.content_iterations || 1) + 1,
              content: data.content,
              theme_settings: data.theme_settings,
              statistics: data.statistics || { metrics: [], data_points: [] }
            })
            .eq('id', landingPage.id);

          if (updateError) {
            console.error('Error updating landing page:', updateError);
            throw updateError;
          }
        }

        setCurrentContent({
          hero: { 
            content: data.content.hero,
            layout: "centered" 
          },
          value_proposition: { 
            content: {
              title: "Why Choose Us",
              items: data.content.features || []
            },
            layout: "grid" 
          },
          features: { 
            content: {
              title: "Our Features",
              items: data.content.benefits || []
            },
            layout: "grid" 
          },
          proof: { 
            content: {
              title: "Customer Testimonials",
              testimonials: data.content.testimonials || []
            },
            layout: "grid" 
          },
          pricing: { 
            content: {
              title: "Our Pricing",
              plans: data.content.pricing?.plans || []
            },
            layout: "grid" 
          },
          faq: {
            content: {
              title: "Frequently Asked Questions",
              items: data.content.faq?.items || []
            },
            layout: "default"
          },
          finalCta: { 
            content: {
              title: data.content.cta?.title || "Ready to Get Started?",
              description: data.content.cta?.description || "Join us today and experience the difference.",
              ctaText: data.content.cta?.buttonText || "Get Started Now"
            },
            layout: "centered" 
          },
          footer: { 
            content: {
              links: data.content.footer || {
                company: ["About", "Contact", "Careers"],
                resources: ["Help Center", "Terms", "Privacy"]
              }
            },
            layout: "grid" 
          }
        });

        setCurrentLayoutStyle(data.theme_settings);

        toast({
          title: "Content Generated",
          description: "Your landing page content has been updated."
        });

        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['landing-page', project.id] });
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
      setGenerationProgress({ status: "", progress: 0 });
    }
  };

  const refineLandingPageContent = async () => {
    setIsRefining(true);
    setGenerationProgress({ status: "Refining content...", progress: 0 });
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-landing-page', {
        body: {
          projectId: project.id,
          businessName: project.title,
          businessIdea: project.business_idea,
          targetAudience: project.target_audience,
          currentContent: currentContent,
          isRefinement: true,
          iterationNumber: (landingPage?.content_iterations || 1) + 1
        }
      });

      if (error) throw error;

      if (data) {
        // Update with refined content
        setCurrentContent({
          ...currentContent,
          ...data.content
        });

        toast({
          title: "Content Refined",
          description: "Your landing page content has been improved."
        });
      }
    } catch (error) {
      console.error('Error refining content:', error);
      toast({
        title: "Error",
        description: "Failed to refine landing page content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefining(false);
      setGenerationProgress({ status: "", progress: 0 });
    }
  };

  const renderSection = (sectionKey: string) => {
    if (!currentContent[sectionKey]) {
      return null;
    }

    const sectionData = currentContent[sectionKey];
    if (!sectionData?.content) {
      return null;
    }

    const Component = sectionComponents[sectionKey];
    if (!Component) {
      return null;
    }

    // Apply theme settings
    const themeProps = {
      ...currentLayoutStyle,
      className: cn(
        "w-full",
        sectionKey === 'hero' && "bg-gradient-to-r from-blue-50 to-indigo-50",
        sectionKey === 'value_proposition' && "bg-white",
        sectionKey === 'features' && "bg-gray-50",
        sectionKey === 'proof' && "bg-white",
        sectionKey === 'pricing' && "bg-gray-50",
        sectionKey === 'faq' && "bg-white",
        sectionKey === 'finalCta' && "bg-gradient-to-r from-primary/10 to-accent/10",
        sectionKey === 'footer' && "bg-gray-900 text-white"
      )
    };

    return (
      <div key={`${sectionKey}-${landingPage?.id}`} {...themeProps}>
        <Component
          content={sectionData.content}
          layout={sectionData.layout || "default"}
          theme={currentLayoutStyle}
        />
      </div>
    );
  };

  if (isTemplateLoading) {
    return <LoadingStateLandingPage />;
  }

  const sectionOrder = [
    "hero",
    "value_proposition",
    "features",
    "proof",
    "pricing",
    "faq",
    "finalCta",
    "footer"
  ];

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
              {landingPage?.content && (
                <Button
                  variant="outline"
                  onClick={refineLandingPageContent}
                  disabled={isGenerating || isRefining}
                >
                  {isRefining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <RotateCw className="mr-2 h-4 w-4" />
                      Refine Content
                    </>
                  )}
                </Button>
              )}
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
