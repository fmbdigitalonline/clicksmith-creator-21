
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  AdVariant, 
  DatabaseAdVariant, 
  Platform, 
  PlatformAdState, 
  AdGenerationState,
  convertToAdVariant,
  convertToDatabaseFormat
} from "@/types/adGeneration";

export const useAdGeneration = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[]
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [adVariants, setAdVariants] = useState<AdVariant[]>([]);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [platformStates, setPlatformStates] = useState<Record<Platform, PlatformAdState>>({
    facebook: { isLoading: false, hasError: false, variants: [] },
    google: { isLoading: false, hasError: false, variants: [] },
    linkedin: { isLoading: false, hasError: false, variants: [] },
    tiktok: { isLoading: false, hasError: false, variants: [] }
  });
  const [state, setState] = useState<AdGenerationState>({
    isInitialLoad: true,
    hasSavedAds: false,
    platformSpecificAds: platformStates
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { projectId } = useParams();

  const checkCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.rpc('check_user_credits', {
        p_user_id: user?.id,
        required_credits: 1
      });

      if (error) throw error;

      if (data && data[0].has_credits) {
        return true;
      } else {
        toast({
          title: "Insufficient credits",
          description: data?.[0]?.error_message || "Please upgrade to continue generating ads",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error checking credits:', error);
      toast({
        title: "Error",
        description: "Failed to check credits. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    const loadSavedAds = async () => {
      if (projectId && projectId !== 'new') {
        const { data: project } = await supabase
          .from('projects')
          .select('generated_ads')
          .eq('id', projectId)
          .single();
        
        if (project?.generated_ads) {
          const variants = (project.generated_ads as unknown[])
            .map(convertToAdVariant)
            .filter((v): v is AdVariant => v !== null);
            
          setAdVariants(variants);
          setState(prev => ({ ...prev, hasSavedAds: true }));
        }
      }
      setState(prev => ({ ...prev, isInitialLoad: false }));
    };

    loadSavedAds();
  }, [projectId]);

  const generateAds = async (selectedPlatform: Platform) => {
    setIsGenerating(true);
    setPlatformStates(prev => ({
      ...prev,
      [selectedPlatform]: { ...prev[selectedPlatform], isLoading: true, hasError: false }
    }));
    setGenerationStatus("Checking credits availability...");
    
    try {
      const hasCredits = await checkCredits();
      if (!hasCredits) {
        setIsGenerating(false);
        return;
      }

      setGenerationStatus(`Initializing ${selectedPlatform} ad generation...`);
      
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

      const rawVariants = data?.variants || [];
      const variants = rawVariants
        .map(convertToAdVariant)
        .filter((v): v is AdVariant => v !== null);

      setGenerationStatus("Processing generated content...");
      
      const processedVariants = await Promise.all(variants.map(async (variant: AdVariant) => {
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
          };
        } catch (error) {
          console.error('Error processing variant:', error);
          return null;
        }
      }));

      const validVariants = processedVariants.filter((v): v is AdVariant => v !== null);
      
      setPlatformStates(prev => ({
        ...prev,
        [selectedPlatform]: {
          isLoading: false,
          hasError: false,
          variants: validVariants
        }
      }));

      if (projectId && projectId !== 'new') {
        const databaseVariants = validVariants.map(convertToDatabaseFormat);
        
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            generated_ads: databaseVariants
          })
          .eq('id', projectId);

        if (updateError) {
          console.error('Error updating project:', updateError);
        }
      }
      
      setRegenerationCount(prev => prev + 1);
      setState(prev => ({ ...prev, hasSavedAds: true }));
      
      toast({
        title: "Ads generated successfully",
        description: "Your new ad variants are ready!",
      });
    } catch (error: any) {
      console.error('Ad generation error:', error);
      setPlatformStates(prev => ({
        ...prev,
        [selectedPlatform]: {
          ...prev[selectedPlatform],
          isLoading: false,
          hasError: true,
          errorMessage: error.message
        }
      }));
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
    platformStates,
    state
  };
};
