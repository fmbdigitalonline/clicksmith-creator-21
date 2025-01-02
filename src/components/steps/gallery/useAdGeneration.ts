import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export const useAdGeneration = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[]
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [adVariants, setAdVariants] = useState<any[]>([]);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const validateResponse = (data: any) => {
    if (!data) {
      throw new Error("No data received from generation");
    }

    const variants = data.variants;
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error("Invalid or empty variants received");
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

    queryClient.invalidateQueries({ queryKey: ['credits'] });
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    return result[0];
  };

  const generateAds = async (selectedPlatform: string) => {
    setIsGenerating(true);
    setGenerationStatus("Checking credits availability...");
    
    try {
      const { data: creditCheck, error: creditError } = await supabase.rpc(
        'check_user_credits',
        { 
          p_user_id: (await supabase.auth.getUser()).data.user?.id,
          required_credits: 1
        }
      );

      if (creditError || !creditCheck?.[0]?.has_credits) {
        toast({
          title: "No credits available",
          description: "Please purchase more credits to continue generating ads",
          variant: "destructive",
        });
        navigate('/pricing');
        return;
      }

      setGenerationStatus("Initializing ad generation...");
      console.log('Generating ads for platform:', selectedPlatform, 'with target audience:', targetAudience);
      
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: {
          platform: selectedPlatform,
          businessIdea,
          targetAudience: {
            ...targetAudience,
            name: targetAudience.name,
            description: targetAudience.description,
            demographics: targetAudience.demographics,
            painPoints: targetAudience.painPoints
          },
          adHooks,
        },
      });

      if (error) {
        throw error;
      }

      console.log('Generation response:', data);
      const variants = validateResponse(data);

      setGenerationStatus("Processing generated content...");
      
      const processedVariants = await Promise.all(variants.map(async (variant: any) => {
        if (!variant.imageUrl) {
          console.warn('Variant missing imageUrl:', variant);
          return null;
        }

        try {
          const { data: imageVariant, error: storeError } = await supabase
            .from('ad_image_variants')
            .insert({
              original_image_url: variant.imageUrl,
              resized_image_urls: variant.resizedUrls || {},
              user_id: (await supabase.auth.getUser()).data.user?.id
            })
            .select()
            .single();

          if (storeError) {
            console.error('Error storing image variant:', storeError);
            return null;
          }

          return {
            ...variant,
            id: imageVariant.id,
            imageUrl: variant.imageUrl,
            resizedUrls: variant.resizedUrls || {},
          };
        } catch (error) {
          console.error('Error processing variant:', error);
          return null;
        }
      }));

      await deductCredits();

      console.log('Processed ad variants:', processedVariants);
      setAdVariants(processedVariants.filter(Boolean));
      setRegenerationCount(prev => prev + 1);
      
      toast({
        title: "Ads generated successfully",
        description: "Your new ad variants are ready!",
      });
    } catch (error: any) {
      console.error('Ad generation error:', error);
      toast({
        title: "Error generating ads",
        description: error.message || "Failed to generate ads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationStatus("");
    }
  };

  return {
    isGenerating,
    adVariants,
    regenerationCount,
    generationStatus,
    generateAds,
  };
};
