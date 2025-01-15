import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { VideoAdVariant } from "@/types/videoAdTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

export const useAdGeneration = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[]
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [adVariants, setAdVariants] = useState<any[]>([]);
  const [videoVariants, setVideoVariants] = useState<VideoAdVariant[]>([]);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { projectId } = useParams();

  const generateAds = async (selectedPlatform: string) => {
    setIsGenerating(true);
    setGenerationStatus("Checking credits availability...");
    
    try {
      const hasCredits = await checkCredits();
      if (!hasCredits) return;

      setGenerationStatus("Initializing ad generation...");
      
      // Generate image ads
      setGenerationStatus("Generating image ads...");
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

      // Process variants based on platform
      const variants = data.variants.map((variant: any) => ({
        ...variant,
        platform: selectedPlatform,
        size: getPlatformAdSize(selectedPlatform),
      }));

      setAdVariants(variants);

      toast({
        title: "Ads generated successfully",
        description: `Your new ${selectedPlatform} ad variants are ready!`,
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

  const getPlatformAdSize = (platform: string) => {
    switch (platform) {
      case 'google':
        return {
          width: 1200,
          height: 628,
          label: "Google Display"
        };
      case 'facebook':
        return {
          width: 1200,
          height: 628,
          label: "Facebook Feed"
        };
      case 'linkedin':
        return {
          width: 1200,
          height: 627,
          label: "LinkedIn Feed"
        };
      case 'tiktok':
        return {
          width: 1080,
          height: 1920,
          label: "TikTok Feed"
        };
      default:
        return {
          width: 1200,
          height: 628,
          label: "Standard Display"
        };
    }
  };

  const checkCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: creditCheck, error: creditsError } = await supabase.rpc(
      'check_user_credits',
      { p_user_id: user.id, required_credits: 1 }
    );

    if (creditsError) {
      throw creditsError;
    }

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

  return {
    isGenerating,
    adVariants,
    videoVariants,
    generationStatus,
    generateAds,
  };
};