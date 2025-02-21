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

  useEffect(() => {
    const loadSavedAds = async () => {
      console.log('Loading saved ads for project:', projectId);
      if (projectId && projectId !== 'new') {
        const { data: project } = await supabase
          .from('projects')
          .select('generated_ads')
          .eq('id', projectId)
          .single();
        
        console.log('Loaded project data:', project);
        
        if (project?.generated_ads && Array.isArray(project.generated_ads)) {
          const variants = (project.generated_ads as unknown[])
            .map(convertToAdVariant)
            .filter((v): v is AdVariant => v !== null);
            
          console.log('Setting ad variants from project:', variants);
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
      console.log('Generating ads for platform:', selectedPlatform, 'with target audience:', targetAudience);
      
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: {
          type: 'complete_ads',
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
          throw error;
        }
      }));

      // Filter out any null values
      const validVariants = processedVariants.filter((v): v is AdVariant => v !== null);
      console.log('Successfully processed variants:', validVariants);
      
      // Update platform state
      setPlatformStates(prev => ({
        ...prev,
        [selectedPlatform]: {
          isLoading: false,
          hasError: false,
          variants: validVariants
        }
      }));

      // Save to project if we have a project ID
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

  const validateResponse = (data: any): AdVariant[] => {
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
    regenerationCount,
    generationStatus,
    generateAds,
    platformStates,
    state
  };
};
