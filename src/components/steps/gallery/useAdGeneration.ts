
import { useState, useRef, useCallback } from "react";
import { BusinessIdea, TargetAudience } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCreditsAndGeneration } from "@/hooks/useCreditsAndGeneration";

// Define interface for ad variants
interface AdVariant {
  platform: string;
  content: string;
  [key: string]: any;
}

// Define the GenerationResponse interface to match the expected type
interface GenerationResponse {
  success: boolean;
  data?: AdVariant[];
  error?: string;
}

type GenerationState = 'idle' | 'checking_credits' | 'generating' | 'error';

export const useAdGeneration = () => {
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [adVariants, setAdVariants] = useState<AdVariant[]>([]);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const { toast } = useToast();
  const { generateWithCredits } = useCreditsAndGeneration();

  // Track if component is mounted
  const isMountedRef = useRef(true);
  // Track the debounce timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track active toast IDs
  const activeToastRef = useRef<string | null>(null);

  // Cleanup function
  const cleanup = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  };

  // Function to handle toasts with deduplication
  const showToast = useCallback((title: string, description: string, variant: "default" | "destructive" = "default") => {
    // Dismiss previous toast if it exists
    if (activeToastRef.current) {
      // Create a new toast to replace the previous one with open: false
      toast({
        title: "",
        description: "",
        open: false,
      });
    }
    
    // Show new toast and store its ID
    const { id } = toast({
      title,
      description,
      variant,
      duration: 3000, // 3 seconds
    });
    
    activeToastRef.current = id;
  }, [toast]);

  // Function to handle network errors with exponential backoff
  const handleNetworkError = async (error: any, retryCount: number = 0): Promise<GenerationResponse> => {
    const isNetworkError = error.message?.includes('network') || error.message?.includes('fetch');
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    if (isNetworkError && retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`Retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      
      showToast(
        "Retrying Connection",
        `Attempt ${retryCount + 1} of ${maxRetries}...`,
        "default"
      );
      
      return { success: false, error: 'Retrying due to network error' };
    }
    throw error;
  };

  const generateAds = useCallback(async (platform: string) => {
    // Don't start a new request if one is already in progress
    if (generationState !== 'idle') {
      console.log('Generation already in progress, skipping request');
      return null;
    }

    // Cleanup any existing request
    cleanup();

    // Clear any existing errors
    setError(null);

    // Start generation with debouncing
    return new Promise<AdVariant[] | null>((resolve) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return null;

        try {
          setGenerationState('checking_credits');
          setGenerationStatus("Checking credits availability...");

          let retryCount = 0;
          
          const result = await generateWithCredits<AdVariant[]>(
            async (): Promise<GenerationResponse> => {
              try {
                setGenerationState('generating');
                setGenerationStatus("Generating ads...");

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
            setGenerationState('error');
            setError('Failed to generate ads');
            return null;
          }

          setAdVariants(result);
          setGenerationState('idle');
          
          showToast(
            "Ads Generated Successfully",
            "Your ads have been created and credits have been deducted."
          );

          resolve(result);
        } catch (error) {
          if (!isMountedRef.current) return null;

          console.error('Final error in generation:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
          
          setError(errorMessage);
          setGenerationState('error');
          
          showToast(
            "Generation Failed",
            errorMessage,
            "destructive"
          );

          resolve(null);
        } finally {
          if (isMountedRef.current) {
            setGenerationStatus("");
            setGenerationState((currentState) => 
              currentState === 'error' ? 'error' : 'idle'
            );
          }
        }
      }, 500); // 500ms debounce delay
    });
  }, [generateWithCredits, generationState, showToast]);

  // Cleanup on unmount
  const destroy = useCallback(() => {
    isMountedRef.current = false;
    cleanup();
    // Clear any active toasts
    if (activeToastRef.current) {
      // Create a new toast with open: false to dismiss the previous one
      toast({
        title: "",
        description: "",
        open: false,
      });
    }
  }, [toast]);

  return {
    isGenerating: generationState !== 'idle',
    error,
    adVariants,
    generationStatus,
    generateAds,
    destroy,
  };
};
