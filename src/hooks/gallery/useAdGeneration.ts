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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return false;

    const { data, error } = await supabase.rpc('check_user_credits', {
      p_user_id: user.id,
      required_credits: 1
    });

    if (error) {
      console.error('Error checking credits:', error);
      toast({
        title: "Error",
        description: "Failed to check credits availability",
        variant: "destructive"
      });
      return false;
    }

    if (!data[0].has_credits) {
      toast({
        title: "Insufficient Credits",
        description: data[0].error_message || "Please purchase more credits to continue",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

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
    
    try {
      const hasCredits = await checkCredits();
      if (!hasCredits) {
        setIsGenerating(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: {
          type: 'complete_ads',
          platform: selectedPlatform,
          businessIdea,
          targetAudience,
          adHooks
        }
      });

      if (error) throw error;

      const variants = (Array.isArray(data) ? data : [])
        .map(item => convertToAdVariant(item))
        .filter((v): v is AdVariant => v !== null);

      // Save to project if we have a project ID
      if (projectId && projectId !== 'new') {
        const databaseVariants = variants.map(convertToDatabaseFormat);
        
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
