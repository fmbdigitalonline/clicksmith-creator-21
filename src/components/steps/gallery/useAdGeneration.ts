import { useState } from "react";
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

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

  const deductCredits = async () => {
    const { data: result, error } = await supabase.rpc(
      'deduct_user_credits',
      { 
        input_user_id: (await supabase.auth.getUser()).data.user?.id,
        credits_to_deduct: 1
      }
    );

    if (error || !result?.[0]?.success) {
      throw new Error(error?.message || result?.[0]?.error_message || 'Failed to deduct credits');
    }

    // Invalidate queries to refresh UI
    queryClient.invalidateQueries({ queryKey: ['credits'] });
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    return result[0];
  };

  const generateAds = async (selectedPlatform: string) => {
    setIsGenerating(true);
    setGenerationStatus("Checking credits availability...");
    
    try {
      // First check if user has enough credits
      const { data: creditCheck, error: creditError } = await supabase.rpc(
        'check_user_credits',
        { 
          p_user_id: (await supabase.auth.getUser()).data.user?.id,
          required_credits: 1
        }
      );

      if (creditError || !creditCheck?.[0]?.has_credits) {
        throw new Error(creditError?.message || creditCheck?.[0]?.error_message || 'Insufficient credits');
      }

      setGenerationStatus("Initializing ad generation...");
      console.log('Generating ads for platform:', selectedPlatform, 'with target audience:', targetAudience);
      
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: videoAdsEnabled ? 'video_ads' : 'complete_ads',
          businessIdea,
          targetAudience: {
            ...targetAudience,
            name: targetAudience.name,
            description: targetAudience.description,
            demographics: targetAudience.demographics,
            painPoints: targetAudience.painPoints,
            icp: targetAudience.icp,
            coreMessage: targetAudience.coreMessage,
            positioning: targetAudience.positioning,
            marketingAngle: targetAudience.marketingAngle,
            messagingApproach: targetAudience.messagingApproach,
            marketingChannels: targetAudience.marketingChannels
          },
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

      // Deduct credits after successful generation
      await deductCredits();

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