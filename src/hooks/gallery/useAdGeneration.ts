import { useState, useEffect } from "react";
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { 
  AdGenerationState, 
  PlatformAdState, 
  AdVariant, 
  Platform, 
  DatabaseAdVariant 
} from "@/types/adGeneration";
import { AD_FORMATS } from "@/components/steps/gallery/components/AdSizeSelector";

const initialPlatformState: PlatformAdState = {
  isLoading: false,
  hasError: false,
  errorMessage: undefined,
  variants: [],
};

const initialState: AdGenerationState = {
  isInitialLoad: true,
  hasSavedAds: false,
  platformSpecificAds: {
    facebook: { ...initialPlatformState },
    google: { ...initialPlatformState },
    linkedin: { ...initialPlatformState },
    tiktok: { ...initialPlatformState },
  },
};

export const useAdGeneration = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[]
) => {
  const [state, setState] = useState<AdGenerationState>(initialState);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { projectId } = useParams();

  // Load saved ads when component mounts
  useEffect(() => {
    const loadSavedAds = async () => {
      if (!projectId || projectId === 'new') {
        setState(prev => ({ ...prev, isInitialLoad: false }));
        return;
      }

      console.log("Loading saved ads for project:", projectId);
      try {
        const { data: project } = await supabase
          .from('projects')
          .select('generated_ads')
          .eq('id', projectId)
          .single();
        
        if (project?.generated_ads && Array.isArray(project.generated_ads)) {
          console.log('Found saved ads:', project.generated_ads);
          
          // Group ads by platform and ensure proper typing
          const platformAds: Partial<Record<Platform, AdVariant[]>> = {};
          (project.generated_ads as DatabaseAdVariant[]).forEach((ad) => {
            const platform = ad.platform as Platform;
            if (!platformAds[platform]) {
              platformAds[platform] = [];
            }
            // Ensure each ad has a size
            const adWithSize: AdVariant = {
              ...ad,
              platform,
              size: ad.size || AD_FORMATS[0]
            };
            platformAds[platform]?.push(adWithSize);
          });

          // Update state for each platform
          setState(prev => ({
            ...prev,
            isInitialLoad: false,
            hasSavedAds: true,
            platformSpecificAds: {
              ...prev.platformSpecificAds,
              ...(Object.entries(platformAds).reduce((acc, [platform, variants]) => ({
                ...acc,
                [platform]: {
                  ...initialPlatformState,
                  variants: variants || []
                }
              }), {}) as Record<Platform, PlatformAdState>)
            }
          }));
        } else {
          setState(prev => ({ ...prev, isInitialLoad: false }));
        }
      } catch (error) {
        console.error('Error loading saved ads:', error);
        setState(prev => ({ ...prev, isInitialLoad: false }));
      }
    };

    loadSavedAds();
  }, [projectId]);

  const checkCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: creditCheck, error } = await supabase.rpc(
      'check_user_credits',
      { p_user_id: user.id, required_credits: 1 }
    );

    if (error) {
      throw error;
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

  const generateAds = async (selectedPlatform: Platform) => {
    // Skip generation if we already have ads for this platform
    if (state.platformSpecificAds[selectedPlatform]?.variants.length > 0) {
      console.log(`Using existing ads for ${selectedPlatform}`);
      return;
    }

    // Update loading state for the specific platform
    setState(prev => ({
      ...prev,
      platformSpecificAds: {
        ...prev.platformSpecificAds,
        [selectedPlatform]: {
          ...prev.platformSpecificAds[selectedPlatform],
          isLoading: true,
          hasError: false,
        }
      }
    }));

    setGenerationStatus("Checking credits availability...");
    
    try {
      const hasCredits = await checkCredits();
      if (!hasCredits) return;

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

      setGenerationStatus("Processing generated content...");
      
      const processedVariants = await Promise.all((data.variants as DatabaseAdVariant[]).map(async (variant) => {
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

          const adVariant: AdVariant = {
            ...variant,
            id: imageVariant.id,
            platform: selectedPlatform,
            size: variant.size || AD_FORMATS[0]
          };

          return adVariant;
        } catch (error) {
          console.error('Error processing variant:', error);
          return null;
        }
      }));

      const validVariants = processedVariants.filter((v): v is AdVariant => v !== null);
      
      // Update state with new variants
      setState(prev => ({
        ...prev,
        platformSpecificAds: {
          ...prev.platformSpecificAds,
          [selectedPlatform]: {
            isLoading: false,
            hasError: false,
            variants: validVariants
          }
        }
      }));

      // Save to project if we have a project ID
      if (projectId && projectId !== 'new') {
        const allVariants = [
          ...Object.values(state.platformSpecificAds)
            .flatMap(p => p.variants)
            .filter(v => v.platform !== selectedPlatform),
          ...validVariants
        ];

        const { error: updateError } = await supabase
          .from('projects')
          .update({
            generated_ads: allVariants
          })
          .eq('id', projectId);

        if (updateError) {
          console.error('Error updating project:', updateError);
          throw updateError;
        }
      }

      toast({
        title: "Ads generated successfully",
        description: `Your new ${selectedPlatform} ad variants are ready!`,
      });
    } catch (error: any) {
      console.error('Ad generation error:', error);
      
      setState(prev => ({
        ...prev,
        platformSpecificAds: {
          ...prev.platformSpecificAds,
          [selectedPlatform]: {
            ...prev.platformSpecificAds[selectedPlatform],
            isLoading: false,
            hasError: true,
            errorMessage: error.message
          }
        }
      }));

      toast({
        title: "Error generating ads",
        description: error.message || "Failed to generate ads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerationStatus("");
    }
  };

  return {
    state,
    generationStatus,
    generateAds,
  };
};
