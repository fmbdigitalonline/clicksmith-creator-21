import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
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
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { projectId } = useParams();

  const validateInputs = () => {
    if (!businessIdea?.description) {
      throw new Error("Business idea description is required");
    }
    if (!targetAudience?.description) {
      throw new Error("Target audience description is required");
    }
    if (!Array.isArray(adHooks) || adHooks.length === 0) {
      throw new Error("At least one ad hook is required");
    }
  };

  const generateAds = async (selectedPlatform: string) => {
    setIsGenerating(true);
    setGenerationStatus("Checking credits availability...");
    
    try {
      // Validate inputs before proceeding
      validateInputs();

      const hasCredits = await checkCredits();
      if (!hasCredits) return;

      setGenerationStatus("Initializing ad generation...");
      console.log('Generating ads for platform:', selectedPlatform, 'with target audience:', targetAudience);
      
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: {
          type: 'complete_ads',
          platform: selectedPlatform,
          businessIdea: {
            description: businessIdea.description,
            valueProposition: businessIdea.valueProposition
          },
          targetAudience: {
            ...targetAudience,
            name: targetAudience.name,
            description: targetAudience.description,
            demographics: targetAudience.demographics,
            painPoints: targetAudience.painPoints
          },
          adHooks: adHooks.map(hook => ({
            text: hook.text,
            description: hook.description
          })),
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || "Failed to generate ads");
      }

      if (!data || !data.variants) {
        throw new Error("Invalid response from ad generation");
      }

      console.log('Generation response:', data);
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

  const checkCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: creditCheck, error: creditsError } = await supabase.rpc(
      'check_user_credits',
      { p_user_id: user.id, required_credits: 1 }
    );

    if (creditsError) {
      console.error('Credit check error:', creditsError);
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

  const validateResponse = (data: any) => {
    if (!data) {
      throw new Error("No data received from generation");
    }

    const variants = data.variants;
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error("Invalid or empty variants received");
    }

    return variants.map(variant => ({
      ...variant,
      platform: variant.platform || data.platform
    }));
  };

  return {
    isGenerating,
    adVariants,
    generationStatus,
    generateAds,
  };
};