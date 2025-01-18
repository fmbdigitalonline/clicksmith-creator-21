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

  const generateVideoAd = async (
    platform: string,
    hook: AdHook,
    format: { width: number; height: number; label: string }
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-video-ad', {
        body: {
          businessIdea,
          targetAudience,
          hook,
          format: {
            description: format.label,
            dimensions: {
              width: format.width,
              height: format.height
            },
            maxLength: 30
          }
        }
      });

      if (error) throw error;

      if (!data.videoUrl) {
        throw new Error('No video URL returned from generation');
      }

      const newVariant: VideoAdVariant = {
        id: crypto.randomUUID(),
        platform,
        videoUrl: data.videoUrl,
        prompt: data.prompt,
        headline: hook.text,
        description: businessIdea.description,
        status: 'completed'
      };

      setVideoVariants(prev => [...prev, newVariant]);

      if (projectId && projectId !== 'new') {
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            generated_ads: [...adVariants, newVariant]
          })
          .eq('id', projectId);

        if (updateError) {
          console.error('Error updating project:', updateError);
        }
      }

      return newVariant;
    } catch (error) {
      console.error('Error generating video:', error);
      const failedVariant: VideoAdVariant = {
        id: crypto.randomUUID(),
        platform,
        headline: hook.text,
        description: businessIdea.description,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to generate video'
      };
      setVideoVariants(prev => [...prev, failedVariant]);
      throw error;
    }
  };

  const generateAds = async (selectedPlatform: string) => {
    setIsGenerating(true);
    setGenerationStatus("Checking credits availability...");
    
    try {
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
        return;
      }

      setGenerationStatus("Initializing ad generation...");
      
      // Generate video ads if enabled
      if (projectId && projectId !== 'new') {
        const { data: project } = await supabase
          .from('projects')
          .select('video_ads_enabled, video_ad_preferences')
          .eq('id', projectId)
          .single();

        if (project?.video_ads_enabled) {
          setGenerationStatus("Generating video ads...");
          for (const hook of adHooks) {
            try {
              await generateVideoAd(selectedPlatform, hook, {
                width: 1920,
                height: 1080,
                label: "Landscape Video"
              });
            } catch (error) {
              console.error('Error generating video for hook:', hook, error);
              toast({
                title: "Video Generation Error",
                description: error instanceof Error ? error.message : "Failed to generate video",
                variant: "destructive",
              });
            }
          }
        }
      }

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

      const variants = validateResponse(data);
      setAdVariants(prev => [...prev, ...variants]);

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
    if (!data) {
      throw new Error("No data received from generation");
    }

    const variants = data.variants;
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error("Invalid or empty variants received");
    }

    return variants;
  };

  return {
    isGenerating,
    adVariants,
    videoVariants,
    generationStatus,
    generateAds,
  };
};