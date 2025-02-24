
import { useState } from "react";
import { BusinessIdea, TargetAudience } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCreditsAndGeneration } from "@/hooks/useCreditsAndGeneration";

export const useAdGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adVariants, setAdVariants] = useState<any[]>([]);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const { toast } = useToast();
  const { generateWithCredits } = useCreditsAndGeneration();

  const generateAds = async (platform: string) => {
    setIsGenerating(true);
    setError(null);
    setGenerationStatus("Generating ads...");

    const result = await generateWithCredits(
      async () => {
        try {
          const { data, error: functionError } = await supabase.functions.invoke(
            'generate-ad-content',
            {
              body: {
                platform,
                timestamp: new Date().getTime()
              }
            }
          );

          if (functionError) {
            throw functionError;
          }

          if (!data || !Array.isArray(data.ads)) {
            throw new Error('Invalid response format from server');
          }

          return { success: true, data: data.ads };
        } catch (error) {
          console.error('Error generating ads:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to generate ads';
          return { success: false, error: errorMessage };
        }
      },
      1 // Required credits for generation
    );

    setIsGenerating(false);
    setGenerationStatus("");
    
    if (!result) {
      setError('Failed to generate ads');
      return null;
    }

    setAdVariants(result);
    
    toast({
      title: "Ads Generated Successfully",
      description: "Your ads have been created and credits have been deducted.",
    });

    return result;
  };

  return {
    isGenerating,
    error,
    adVariants,
    generationStatus,
    generateAds,
  };
};
