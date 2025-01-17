import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { VideoAdVariant } from "@/types/videoAdTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface UseAdGenerationReturn {
  isGenerating: boolean;
  adVariants: any[];
  videoVariants: VideoAdVariant[];
  generationStatus: string;
  generateAds: (selectedPlatform: string) => Promise<void>;
  resetGeneration: () => void;
}

export const useAdGeneration = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[]
): UseAdGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [adVariants, setAdVariants] = useState<any[]>([]);
  const [videoVariants, setVideoVariants] = useState<VideoAdVariant[]>([]);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const resetGeneration = () => {
    setAdVariants([]);
    setVideoVariants([]);
    setGenerationStatus("");
    setIsGenerating(false);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const invokeSupabaseFunction = async (
    selectedPlatform: string,
    retryCount = 0
  ): Promise<{ data: any; error: any }> => {
    try {
      console.log(`Attempting to generate ads (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: {
          type: 'complete_ads',
          platform: selectedPlatform,
          businessIdea,
          targetAudience,
          adHooks
        },
      });

      if (error) throw error;
      return { data, error: null };

    } catch (error: any) {
      console.error(`Generation attempt ${retryCount + 1} failed:`, error);
      
      if (error.message?.includes('No credits available')) {
        return { data: null, error };
      }

      if (retryCount < MAX_RETRIES) {
        setGenerationStatus(`Network issue detected. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(RETRY_DELAY * Math.pow(2, retryCount));
        return invokeSupabaseFunction(selectedPlatform, retryCount + 1);
      }

      return { data: null, error };
    }
  };

  const generateAds = async (selectedPlatform: string) => {
    setIsGenerating(true);
    setGenerationStatus("Checking credits availability...");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be logged in to generate ads');
      }

      setGenerationStatus(`Initializing ${selectedPlatform} ad generation...`);
      
      const { data, error } = await invokeSupabaseFunction(selectedPlatform);

      if (error) {
        if (error.message?.includes('No credits available')) {
          toast({
            title: "No credits available",
            description: "Please upgrade your plan to continue generating ads.",
            variant: "destructive",
          });
          navigate('/pricing');
          return;
        }
        throw error;
      }

      if (!data || !data.variants) {
        throw new Error('Invalid response format from server');
      }

      console.log('Raw generation response:', data);

      const variants = data.variants.map((variant: any) => ({
        ...variant,
        platform: selectedPlatform,
      }));

      console.log('Processed variants:', variants);
      setAdVariants(variants);

      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['free_tier_usage'] });

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
      setAdVariants([]);
    } finally {
      setIsGenerating(false);
      setGenerationStatus("");
    }
  };

  return {
    isGenerating,
    adVariants,
    videoVariants,
    generationStatus,
    generateAds,
    resetGeneration,
  };
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second