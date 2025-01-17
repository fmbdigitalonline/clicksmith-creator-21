import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { VideoAdVariant } from "@/types/videoAdTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { AdVariant, convertJsonArrayToAdVariants, convertAdVariantToJson } from "@/types/adVariant";

export const useAdGeneration = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[]
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [adVariants, setAdVariants] = useState<AdVariant[]>([]);
  const [videoVariants, setVideoVariants] = useState<VideoAdVariant[]>([]);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const queryClient = useQueryClient();

  // Load saved ads when component mounts
  useEffect(() => {
    const loadSavedAds = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let savedAds: AdVariant[] = [];

        if (projectId && projectId !== 'new') {
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('generated_ads')
            .eq('id', projectId)
            .single();

          if (projectError) throw projectError;
          
          if (project?.generated_ads) {
            console.log('Loading saved ads from project:', project.generated_ads);
            savedAds = convertJsonArrayToAdVariants(project.generated_ads);
          }
        } else {
          const { data: wizardData, error: wizardError } = await supabase
            .from('wizard_progress')
            .select('generated_ads')
            .eq('user_id', user.id)
            .single();

          if (wizardError && !wizardError.message.includes('No rows found')) {
            throw wizardError;
          }

          if (wizardData?.generated_ads) {
            console.log('Loading saved ads from wizard progress:', wizardData.generated_ads);
            savedAds = convertJsonArrayToAdVariants(wizardData.generated_ads);
          }
        }

        if (savedAds.length > 0) {
          setAdVariants(savedAds);
        }
      } catch (error) {
        console.error('Error loading saved ads:', error);
        toast({
          title: "Error loading saved ads",
          description: "Unable to load your previously generated ads.",
          variant: "destructive",
        });
      }
    };

    loadSavedAds();
  }, [projectId, toast]);

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
      if (!user) throw new Error('User must be logged in to generate ads');

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

      const variants: AdVariant[] = data.variants.map((variant: any) => ({
        ...variant,
        platform: selectedPlatform,
      }));

      console.log('Processed variants:', variants);
      setAdVariants(variants);

      // Save generated ads
      const saveGeneratedAds = async () => {
        try {
          const jsonVariants = variants.map(convertAdVariantToJson);
          
          if (projectId && projectId !== 'new') {
            await supabase
              .from('projects')
              .update({ generated_ads: jsonVariants })
              .eq('id', projectId);
          } else {
            await supabase
              .from('wizard_progress')
              .upsert({
                user_id: user.id,
                generated_ads: jsonVariants
              }, {
                onConflict: 'user_id'
              });
          }
        } catch (error) {
          console.error('Error saving generated ads:', error);
          toast({
            title: "Error saving ads",
            description: "Your ads were generated but couldn't be saved for later.",
            variant: "destructive",
          });
        }
      };

      await saveGeneratedAds();
      
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

  const resetGeneration = () => {
    setAdVariants([]);
    setVideoVariants([]);
    setGenerationStatus("");
    setIsGenerating(false);
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