import { useState } from "react";
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAdGeneration = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[],
  videoAdsEnabled: boolean = false
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [adVariants, setAdVariants] = useState<any[]>([]);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const { toast } = useToast();

  const validateResponse = (data: any) => {
    if (!data) {
      throw new Error('No data received from server');
    }

    const variants = data.variants || data;
    if (!Array.isArray(variants)) {
      console.error('Invalid variants format:', variants);
      throw new Error('Invalid response format: variants is not an array');
    }

    return variants;
  };

  const generateAds = async (selectedPlatform: string) => {
    setIsGenerating(true);
    setGenerationStatus("Initializing ad generation...");
    try {
      console.log('Generating ads for platform:', selectedPlatform);
      
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: videoAdsEnabled ? 'video_ads' : 'complete_ads',
          businessIdea,
          targetAudience,
          platform: selectedPlatform,
          campaign: {
            hooks: adHooks,
            specs: videoAdsEnabled ? {
              [selectedPlatform]: {
                formats: ['feed', 'sponsored', 'message'],
                aspectRatios: ['1:1', '16:9']
              }
            } : {
              [selectedPlatform]: {
                commonSizes: [
                  { width: 1200, height: 628, label: `${selectedPlatform} Feed` }
                ]
              }
            }
          },
          regenerationCount: regenerationCount,
          timestamp: new Date().getTime()
        }
      });

      if (error) throw error;

      console.log('Edge Function response:', data);

      const variants = validateResponse(data);

      const processedVariants = variants.map(variant => ({
        ...variant,
        imageUrl: variant.image?.url || variant.imageUrl,
        platform: selectedPlatform,
        size: {
          width: 1200,
          height: 628,
          label: `${selectedPlatform} Feed`
        }
      }));

      console.log('Processed ad variants:', processedVariants);
      setAdVariants(processedVariants);
      setRegenerationCount(prev => prev + 1);
      setGenerationStatus("Generation completed successfully!");
      
      toast({
        title: `Fresh ${videoAdsEnabled ? 'Video Ads' : 'Image Ads'} Generated!`,
        description: "Your new ad variants have been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating ads:', error);
      setGenerationStatus("Generation failed. Please try again.");
      toast({
        title: "Generation Failed",
        description: error instanceof Error 
          ? `Error: ${error.message}. Please try again or contact support.`
          : "Failed to generate ads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    adVariants,
    generationStatus,
    generateAds,
    setAdVariants
  };
};