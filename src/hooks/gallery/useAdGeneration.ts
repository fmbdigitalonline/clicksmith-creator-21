import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { VideoAdVariant } from "@/types/videoAdTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// Define supported platforms
type SupportedPlatform = 'facebook' | 'tiktok' | 'instagram';

// Define platform-specific dimensions
interface PlatformDimensions {
  width: number;
  height: number;
  label: string;
}

const PLATFORM_DIMENSIONS: Record<SupportedPlatform | 'default', PlatformDimensions> = {
  facebook: {
    width: 1200,
    height: 628,
    label: "Facebook Feed"
  },
  tiktok: {
    width: 1080,
    height: 1920,
    label: "TikTok Feed"
  },
  instagram: {
    width: 1080,
    height: 1080,
    label: "Instagram Feed"
  },
  default: {
    width: 1200,
    height: 628,
    label: "Standard Feed"
  }
};

interface AdVariant {
  platform: SupportedPlatform;
  content: string;
  dimensions: PlatformDimensions;
  [key: string]: any; // Allow for flexible properties
}

interface GenerationError extends Error {
  code?: string;
  message: string;
}

interface UseAdGenerationReturn {
  isGenerating: boolean;
  adVariants: AdVariant[];
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
  const [adVariants, setAdVariants] = useState<AdVariant[]>([]);
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

  const handleGenerationError = (error: GenerationError) => {
    console.error('Ad generation error:', error);
    
    if (error.message.includes('No credits available')) {
      toast({
        title: "No credits available",
        description: "Please upgrade your plan to continue generating ads.",
        variant: "destructive",
      });
      navigate('/pricing');
      return true;
    }
    
    toast({
      title: "Error generating ads",
      description: error.message || "Failed to generate ads. Please try again.",
      variant: "destructive",
    });
    setAdVariants([]);
    return false;
  };

  const getPlatformDimensions = (platform: string): PlatformDimensions => {
    return PLATFORM_DIMENSIONS[platform as SupportedPlatform] || PLATFORM_DIMENSIONS.default;
  };

  const generateAds = async (selectedPlatform: string) => {
    setIsGenerating(true);
    setGenerationStatus("Checking credits availability...");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be logged in to generate ads');

      setGenerationStatus(`Initializing ${selectedPlatform} ad generation...`);
      
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: {
          type: 'complete_ads',
          platform: selectedPlatform,
          businessIdea,
          targetAudience,
          adHooks,
          userId: user.id
        },
      });

      if (error) {
        const isHandled = handleGenerationError(error);
        if (isHandled) return;
        throw error;
      }

      console.log('Raw generation response:', data);

      // Process variants with dimensions
      const variants = data.variants.map((variant: any) => ({
        ...variant,
        platform: selectedPlatform,
        dimensions: getPlatformDimensions(selectedPlatform)
      }));

      console.log('Processed variants:', variants);
      setAdVariants(variants);

      // Refresh credits display
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['free_tier_usage'] });

      toast({
        title: "Ads generated successfully",
        description: `Your new ${selectedPlatform} ad variants are ready!`,
      });
    } catch (error: any) {
      handleGenerationError(error);
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
