import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BusinessIdea, TargetAudience, AdHook, AdFormat } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StepNavigation from "./complete/StepNavigation";
import LoadingState from "./complete/LoadingState";
import AdPreviewCard from "./gallery/AdPreviewCard";
import { facebookAdSpecs } from "@/types/facebookAdSpecs";

interface AdGalleryStepProps {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  adHooks: AdHook[];
  adFormat: AdFormat;
  onStartOver: () => void;
  onBack: () => void;
  onCreateProject: () => void;
}

const AdGalleryStep = ({
  businessIdea,
  targetAudience,
  adHooks,
  adFormat,
  onStartOver,
  onBack,
  onCreateProject,
}: AdGalleryStepProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [adVariants, setAdVariants] = useState<any[]>([]);
  const [platform, setPlatform] = useState<"facebook" | "google">("facebook");
  const { toast } = useToast();

  const generateAds = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: 'complete_ads',
          businessIdea,
          targetAudience,
          campaign: {
            hooks: adHooks,
            format: adFormat,
            specs: {
              facebook: facebookAdSpecs
            }
          }
        }
      });

      if (error) throw error;

      // Transform the variants to include all Facebook ad sizes
      const transformedVariants = data.variants.map((variant: any) => {
        if (variant.platform === 'facebook') {
          return [
            // Square format (1:1)
            {
              ...variant,
              size: {
                width: 1440,
                height: 1440,
                label: "Square Feed Ad"
              },
              specs: facebookAdSpecs.imageAds
            },
            // Portrait format (4:5)
            {
              ...variant,
              size: {
                width: 1440,
                height: 1800,
                label: "Portrait Feed Ad"
              },
              specs: facebookAdSpecs.imageAds
            }
          ];
        }
        return variant;
      }).flat();

      setAdVariants(transformedVariants);
      
      toast({
        title: "Ads Generated!",
        description: "Your ad variants have been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating ads:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate ads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (adVariants.length === 0) {
      generateAds();
    }
  }, []);

  return (
    <div className="space-y-6 md:space-y-8">
      <StepNavigation
        onBack={onBack}
        onStartOver={onStartOver}
      />

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Your Ad Gallery</h2>
        <p className="text-gray-600 mb-6">
          Review your generated ad variants optimized for different platforms and formats.
        </p>
      </div>

      {isGenerating ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">
          <Tabs defaultValue="facebook" className="w-full" onValueChange={(value) => setPlatform(value as "facebook" | "google")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="facebook">Facebook Ads</TabsTrigger>
              <TabsTrigger value="google">Google Ads</TabsTrigger>
            </TabsList>
            
            <TabsContent value="facebook" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adVariants
                  .filter(variant => variant.platform === 'facebook')
                  .map((variant, index) => (
                    <AdPreviewCard
                      key={`${index}-${variant.size.label}`}
                      variant={variant}
                      onCreateProject={onCreateProject}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="google" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adVariants
                  .filter(variant => variant.platform === 'google')
                  .map((variant, index) => (
                    <AdPreviewCard
                      key={index}
                      variant={variant}
                      onCreateProject={onCreateProject}
                    />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default AdGalleryStep;