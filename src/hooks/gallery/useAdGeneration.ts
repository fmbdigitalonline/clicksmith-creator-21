import { useState, useEffect } from "react";
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useAdPersistence } from "./useAdPersistence";

export const useAdGeneration = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[]
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { projectId } = useParams();
  
  const {
    savedAds: adVariants,
    isLoading,
    saveGeneratedAds
  } = useAdPersistence(projectId);

  const checkCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: creditCheck, error } = await supabase.rpc(
      'check_user_credits',
      { p_user_id: user.id, required_credits: 1 }
    );

    if (error) throw error;

    const result = creditCheck[0];
    
    if (!result.has_credits) {
      toast({
        title: "No credits available",
        description: result.error_message,
        variant: "destructive",
      });
      navigate('/pricing');
      return false;
    }

    return true;
  };

  const generateAds = async (selectedPlatform: string) => {
    setIsGenerating(true);
    setGenerationStatus("Checking credits availability...");
    
    try {
      const hasCredits = await checkCredits();
      if (!hasCredits) return;

      setGenerationStatus("Initializing ad generation...");
      
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: {
          type: 'complete_ads',
          platform: selectedPlatform,
          businessIdea,
          targetAudience,
          adHooks,
        },
      });

      if (error) throw error;

      const variants = validateResponse(data);
      setGenerationStatus("Processing generated content...");
      
      const processedVariants = await processVariants(variants);
      await saveGeneratedAds(processedVariants);

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

  const validateResponse = (data: any) => {
    if (!data) throw new Error("No data received from generation");
    
    const variants = data.variants;
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error("Invalid or empty variants received");
    }
    
    return variants;
  };

  const processVariants = async (variants: any[]) => {
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
            user_id: (await supabase.auth.getUser()).data.user?.id,
            project_id: projectId !== 'new' ? projectId : null
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
          platform: variant.platform
        };
      } catch (error) {
        console.error('Error processing variant:', error);
        return null;
      }
    }));

    return processedVariants.filter(Boolean);
  };

  return {
    isGenerating,
    adVariants,
    generationStatus,
    generateAds,
    isLoading
  };
};