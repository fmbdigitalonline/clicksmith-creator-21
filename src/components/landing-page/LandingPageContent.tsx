
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface LandingPageContentProps {
  project: any;
  landingPage: any;
}

const colorSchemes = [
  {
    id: "modern",
    colors: {
      primary: "from-purple-100 to-purple-50",
      secondary: "from-blue-50 to-indigo-50",
      accent: "blue-500",
      text: "gray-600"
    }
  },
  {
    id: "clean",
    colors: {
      primary: "from-blue-50 to-cyan-50",
      secondary: "from-gray-50 to-white",
      accent: "cyan-500",
      text: "gray-700"
    }
  },
  {
    id: "bold",
    colors: {
      primary: "from-orange-100 to-rose-100",
      secondary: "from-amber-50 to-rose-50",
      accent: "rose-500",
      text: "gray-800"
    }
  },
  {
    id: "nature",
    colors: {
      primary: "from-green-50 to-emerald-50",
      secondary: "from-emerald-50 to-white",
      accent: "emerald-500",
      text: "gray-700"
    }
  }
];

const LandingPageContent = ({ project, landingPage }: LandingPageContentProps) => {
  const [activeView, setActiveView] = useState<"edit" | "preview">("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectImages, setProjectImages] = useState<string[]>([]);
  const { toast } = useToast();
  const [content, setContent] = useState(landingPage?.content || generateInitialContent(project));
  const [colorScheme, setColorScheme] = useState(colorSchemes[0]);

  useEffect(() => {
    const fetchProjectImages = async () => {
      const { data: adImages } = await supabase
        .from('ad_image_variants')
        .select('original_image_url')
        .eq('project_id', project.id);

      if (adImages) {
        setProjectImages(adImages.map(img => img.original_image_url));
      }
    };

    fetchProjectImages();
  }, [project.id]);

  const generateLandingPageContent = async () => {
    setIsGenerating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No authenticated user found");

      // Select a new random color scheme different from the current one
      let newColorScheme;
      do {
        newColorScheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
      } while (newColorScheme.id === colorScheme.id);
      setColorScheme(newColorScheme);

      const { data, error } = await supabase.functions.invoke('generate-landing-page', {
        body: {
          businessIdea: project.business_idea,
          targetAudience: project.target_audience,
          audienceAnalysis: project.audience_analysis,
          projectImages
        },
      });

      if (error) throw error;

      const { data: dbResponse, error: dbError } = await supabase
        .from('landing_pages')
        .upsert({
          project_id: project.id,
          content: data,
          title: project.title || "Landing Page",
          user_id: userData.user.id,
          layout_style: data.layout,
          image_placements: data.imagePlacements
        });

      if (dbError) throw dbError;

      setContent(data);
      toast({
        title: "Success",
        description: "Landing page content generated successfully!",
      });
    } catch (error) {
      console.error('Error generating landing page:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate landing page content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderSection = (sectionType: string, sectionContent: any, images: any[]) => {
    const layout = content.layout?.structure[sectionType];
    if (!layout) return null;

    switch (layout.type) {
      case "carousel":
        return (
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {Array.isArray(sectionContent) ? sectionContent.map((item: any, index: number) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="p-6">
                    {typeof item === 'object' && item.content ? (
                      <div>
                        <p className={`text-${colorScheme.colors.text}`}>{item.content}</p>
                        {item.name && (
                          <p className="mt-2 font-semibold">{item.name}</p>
                        )}
                        {item.role && (
                          <p className="text-sm text-gray-500">{item.role}</p>
                        )}
                      </div>
                    ) : (
                      <p className={`text-${colorScheme.colors.text}`}>{item}</p>
                    )}
                  </Card>
                </CarouselItem>
              )) : null}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        );
      
      case "grid":
        return (
          <div className={`grid md:grid-cols-${layout.columns} gap-6 max-w-6xl mx-auto px-4`}>
            {Array.isArray(sectionContent) ? sectionContent.map((item: any, index: number) => (
              <Card key={index} className="p-6">
                {typeof item === 'object' && item.content ? (
                  <div>
                    <p className={`text-${colorScheme.colors.text}`}>{item.content}</p>
                    {item.name && (
                      <p className="mt-2 font-semibold">{item.name}</p>
                    )}
                    {item.role && (
                      <p className="text-sm text-gray-500">{item.role}</p>
                    )}
                  </div>
                ) : (
                  <p className={`text-${colorScheme.colors.text}`}>{item}</p>
                )}
                {images[index] && (
                  <div className="mt-4">
                    <img 
                      src={images[index].url} 
                      alt=""
                      className="w-full h-48 object-cover rounded-lg shadow-lg" 
                    />
                  </div>
                )}
              </Card>
            )) : null}
          </div>
        );

      case "split":
        return (
          <div className="flex flex-col md:flex-row items-center gap-8 max-w-6xl mx-auto px-4">
            <div className="flex-1 space-y-6">
              {Array.isArray(sectionContent) ? sectionContent.map((item: any, index: number) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`w-2 h-2 rounded-full bg-${colorScheme.colors.accent} mt-2`} />
                  {typeof item === 'object' && item.content ? (
                    <div className="flex-1">
                      <p className={`text-${colorScheme.colors.text}`}>{item.content}</p>
                      {item.name && (
                        <p className="mt-2 font-semibold">{item.name}</p>
                      )}
                      {item.role && (
                        <p className="text-sm text-gray-500">{item.role}</p>
                      )}
                    </div>
                  ) : (
                    <p className={`flex-1 text-${colorScheme.colors.text}`}>{item}</p>
                  )}
                </div>
              )) : null}
            </div>
            {images[0] && (
              <div className="flex-1">
                <img 
                  src={images[0].url} 
                  alt="" 
                  className="w-full rounded-lg shadow-xl"
                />
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="max-w-4xl mx-auto px-4">
            {Array.isArray(sectionContent) ? sectionContent.map((item: any, index: number) => (
              <div key={index}>
                {typeof item === 'object' && item.content ? (
                  <div className="mb-4">
                    <p className={`text-${colorScheme.colors.text}`}>{item.content}</p>
                    {item.name && (
                      <p className="mt-2 font-semibold">{item.name}</p>
                    )}
                    {item.role && (
                      <p className="text-sm text-gray-500">{item.role}</p>
                    )}
                  </div>
                ) : (
                  <p className={`text-${colorScheme.colors.text} mb-4`}>{item}</p>
                )}
              </div>
            )) : null}
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "edit" | "preview")}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>
          <Button 
            onClick={generateLandingPageContent}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate New Layout"}
          </Button>
        </div>
        <TabsContent value="preview" className="mt-6">
          <PreviewMode 
            content={content} 
            colorScheme={colorScheme} 
            renderSection={renderSection}
            projectImages={projectImages}
          />
        </TabsContent>
        <TabsContent value="edit" className="mt-6">
          <EditMode content={content} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface PreviewModeProps {
  content: any;
  colorScheme: any;
  renderSection: any;
  projectImages: string[];
}

const PreviewMode = ({ content, colorScheme, renderSection, projectImages }: PreviewModeProps) => {
  if (!content) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No content available. Click "Generate New Layout" to create a landing page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className={`py-16 px-4 bg-gradient-to-r ${colorScheme.colors.primary}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {content.hero?.title}
              </h1>
              <div className="space-y-4">
                <p className={`text-xl text-${colorScheme.colors.text}`}>
                  {content.hero?.description}
                </p>
                <ul className="space-y-2">
                  {content.features?.slice(0, 2).map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full bg-${colorScheme.colors.accent}`} />
                      <span className={`text-${colorScheme.colors.text}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button size="lg" className={`bg-${colorScheme.colors.accent} text-white px-8`}>
                {content.hero?.cta}
              </Button>
            </div>
            <div className="relative">
              {projectImages[0] ? (
                <img
                  src={projectImages[0]}
                  alt="Hero"
                  className="w-full rounded-lg shadow-2xl"
                />
              ) : (
                <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg flex items-center justify-center">
                  <p className="text-gray-400">Add project images to display here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Key Features</h2>
        {renderSection('features', content.features, content.imagePlacements?.features || [])}
      </section>

      {/* Benefits Section */}
      <section className={`py-12 bg-gradient-to-r ${colorScheme.colors.secondary}`}>
        <h2 className="text-3xl font-bold text-center mb-8">Benefits</h2>
        {renderSection('benefits', content.benefits, content.imagePlacements?.benefits || [])}
      </section>

      {/* Testimonials Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8">What Our Customers Say</h2>
        {renderSection('testimonials', content.socialProof?.testimonials, content.imagePlacements?.testimonials || [])}
      </section>

      {/* Call to Action Section */}
      <section className={`text-center py-16 px-4 rounded-lg bg-gradient-to-r ${colorScheme.colors.primary}`}>
        <h2 className="text-3xl font-bold mb-4">{content.callToAction?.title}</h2>
        <p className={`text-xl text-${colorScheme.colors.text} max-w-2xl mx-auto mb-8`}>
          {content.callToAction?.description}
        </p>
        <Button size="lg" className={`bg-${colorScheme.colors.accent}`}>
          {content.callToAction?.buttonText}
        </Button>
      </section>
    </div>
  );
};

const EditMode = ({ content }: { content: any }) => {
  return (
    <pre className="p-4 bg-gray-50 rounded-lg overflow-auto">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
};

const generateInitialContent = (project: any) => {
  const { business_idea, target_audience, audience_analysis } = project;
  
  return {
    hero: {
      title: business_idea?.valueProposition || project.title,
      description: business_idea?.description || "",
      cta: "Get Started Now",
    },
    features: audience_analysis?.keyFeatures || [],
    benefits: audience_analysis?.benefits || [],
    painPoints: target_audience?.painPoints || [],
    socialProof: {
      testimonials: []
    },
    callToAction: {
      title: "Ready to Get Started?",
      description: "Join thousands of satisfied customers and transform your business today.",
      buttonText: "Start Now",
    }
  };
};

export default LandingPageContent;
