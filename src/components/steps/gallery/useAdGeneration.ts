import { useState, useRef, useCallback } from "react";
import { BusinessIdea, TargetAudience } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCreditsAndGeneration } from "@/hooks/useCreditsAndGeneration";

// Define interface for ad variants
interface AdVariant {
  platform: string;
  content: string;
  // Add other properties as needed
  [key: string]: any;
}

interface GenerationResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface GenerationState {
  status: 'idle' | 'generating' | 'error';
  message?: string;
  type?: 'credits' | 'generation';
}

class InsufficientCreditsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientCreditsError';
  }
}

export const useAdGeneration = () => {
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
  const [adVariants, setAdVariants] = useState<AdVariant[]>([]);
  const { toast } = useToast();
  const { generateWithCredits, checkCreditsAvailable } = useCreditsAndGeneration();

  const isMountedRef = useRef(true);
  const debounceTimeoutRef = useRef<number | null>(null);

  // Utility function to show toast messages
  const showToast = useCallback((title: string, description: string, variant: "default" | "destructive" = "default") => {
    toast({ title, description, variant });
  }, [toast]);

  // Function to handle network errors with retry logic
  const handleNetworkError = async (error: Error, retryCount: number): Promise<GenerationResponse> => {
    if (retryCount < 3 && error.message.includes('Network error')) {
      console.log(`Retrying ad generation (attempt ${retryCount + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return { success: false, error: 'Retrying due to network error' };
    } else {
      return { success: false, error: 'Max retries reached or non-network error' };
    }
  };

  const cleanup = () => {
    isMountedRef.current = false;
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  };

  const destroy = () => {
    cleanup();
  };

  const generateAds = useCallback(async (platform: string) => {
    // Don't start a new request if one is already in progress
    if (generationState.status === 'generating') {
      console.log('Generation already in progress, skipping request');
      return null;
    }

    // Cleanup any existing request
    cleanup();

    // First, silently check credits without showing loading state
    try {
      const { hasCredits, errorMessage } = await checkCreditsAvailable(1);
      
      if (!hasCredits) {
        setGenerationState({
          status: 'error',
          type: 'credits',
          message: errorMessage || 'Insufficient credits'
        });
        
        showToast(
          "Insufficient Credits",
          errorMessage || "Please upgrade to continue generating",
          "destructive"
        );
        
        return null;
      }
    } catch (error) {
      console.error('Error checking credits:', error);
      setGenerationState({
        status: 'error',
        type: 'credits',
        message: 'Failed to check credits'
      });
      return null;
    }

    // Start generation with debouncing
    return new Promise<AdVariant[] | null>((resolve) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return null;

        try {
          setGenerationState({
            status: 'generating',
            message: "Generating ads..."
          });

          let retryCount = 0;
          
          const result = await generateWithCredits<AdVariant[]>(
            async (): Promise<GenerationResponse> => {
              try {
                const { data, error: functionError } = await supabase.functions.invoke(
                  'generate-ad-content',
                  {
                    body: {
                      type: 'complete_ads', // Add the required type parameter
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
                
                // Handle network errors with retry
                if (error instanceof Error) {
                  const retryResponse = await handleNetworkError(error, retryCount++);
                  if (!retryResponse.success) {
                    // If we need to retry, recursively call generateAds
                    const newAttempt = await generateAds(platform);
                    return { success: true, data: newAttempt || undefined };
                  }
                }

                const errorMessage = error instanceof Error ? error.message : 'Failed to generate ads';
                return { success: false, error: errorMessage };
              }
            },
            1 // Required credits for generation
          );

          if (!isMountedRef.current) return null;

          if (!result) {
            setGenerationState({
              status: 'error',
              type: 'generation',
              message: 'Failed to generate ads'
            });
            return null;
          }

          setAdVariants(result);
          setGenerationState({ status: 'idle' });
          
          showToast(
            "Ads Generated Successfully",
            "Your ads have been created and credits have been deducted."
          );

          resolve(result);
        } catch (error) {
          if (!isMountedRef.current) return null;

          console.error('Final error in generation:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
          
          setGenerationState({
            status: 'error',
            type: 'generation',
            message: errorMessage
          });
          
          if (!(error instanceof InsufficientCreditsError)) {
            showToast(
              "Generation Failed",
              errorMessage,
              "destructive"
            );
          }

          resolve(null);
        }
      }, 500); // 500ms debounce delay
    });
  }, [generateWithCredits, generationState.status, showToast, checkCreditsAvailable]);

  const cleanup = () => {
    isMountedRef.current = false;
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  };

  const destroy = () => {
    cleanup();
  };

  return {
    isGenerating: generationState.status === 'generating',
    error: generationState.status === 'error' ? generationState.message : null,
    adVariants,
    generationStatus: generationState.status === 'generating' ? generationState.message : "",
    generateAds,
    destroy,
  };
};
