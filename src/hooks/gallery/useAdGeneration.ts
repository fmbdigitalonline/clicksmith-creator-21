import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { VideoAdVariant } from "@/types/videoAdTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useCallback } from "react";

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
  const queryClient = useQueryClient();

  const reset = useCallback(() => {
    console.log('Resetting ad generation state');
    setAdVariants([]);
    setVideoVariants([]);
    setGenerationStatus("");
    setIsGenerating(false);
  }, []);

  const generateAds = async (selectedPlatform: string) => {
    setIsGenerating(true);
    setGenerationStatus("Checking credits availability...");
    
    try {
      // Get user data first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        throw new Error('User must be logged in to generate ads');
      }

      // Check credits using RPC function
      const { data: creditCheck, error: creditError } = await supabase.rpc(
        'check_user_credits',
        { p_user_id: user.id, required_credits: 1 }
      );

      if (creditError) throw creditError;

      const result = creditCheck[0];
      if (!result.has_credits) {
        toast({
          title: "No credits available",
          description: result.error_message,
          variant: "destructive",
        });
        navigate('/pricing');
        return;
      }

      setGenerationStatus("Initializing ad generation...");
      
      // Generate image ads
      setGenerationStatus(`Generating ${selectedPlatform} ads...`);
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

      if (!data || !data.variants || !Array.isArray(data.variants)) {
        throw new Error('Invalid response format from ad generation');
      }

      // Process variants based on platform
      const variants = data.variants.map((variant: any) => ({
        ...variant,
        platform: selectedPlatform,
        id: crypto.randomUUID(),
        size: getPlatformAdSize(selectedPlatform),
      }));

      console.log('Generated variants:', variants);
      setAdVariants(variants);

      // Deduct credits after successful generation
      const { data: deductResult, error: deductError } = await supabase.rpc(
        'deduct_user_credits',
        { input_user_id: user.id, credits_to_deduct: 1 }
      );

      if (deductError) {
        console.error('Error deducting credits:', deductError);
        throw deductError;
      }

      // Invalidate credits query to refresh the display
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['free_tier_usage'] });

      toast({
        title: "Ads generated successfully",
        description: `Your new ${selectedPlatform} ad variants are ready!`,
      });

      return variants;
    } catch (error: any) {
      console.error('Ad generation error:', error);
      toast({
        title: "Error generating ads",
        description: error.message || "Failed to generate ads. Please try again.",
        variant: "destructive",
      });
      return [];
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

  return {
    isGenerating,
    adVariants,
    videoVariants,
    generationStatus,
    generateAds,
    reset,
  };
};