
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

type GenerationErrorType = 'credits' | 'generation' | 'network';

interface GenerationStateIdle {
  status: 'idle';
}

interface GenerationStateGenerating {
  status: 'generating';
  message: string;
}

interface GenerationStateError {
  status: 'error';
  type: GenerationErrorType;
  message: string;
}

type GenerationState = GenerationStateIdle | GenerationStateGenerating | GenerationStateError;

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
      duration: 3000,
    });
    
    activeToastRef.current = id;
  }, [toast]);

  // Function to handle network errors with exponential backoff
  const handleNetworkError = async (error: any, retryCount: number = 0): Promise<GenerationResponse> => {
    const isNetworkError = error.message?.includes('network') || error.message?.includes('fetch');
    const maxRetries = 3;
    const baseDelay = 1000;

    if (isNetworkError && retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`Retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      
      setGenerationState({
        status: 'generating',
        message: `Retrying connection (attempt ${retryCount + 1}/${maxRetries})...`
      });
      
      await new Promise((resolve) => setTimeout(resolve, delay));
      return { success: false, error: 'Retrying due to network error' };
    }
    throw error;
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

  // Cleanup on unmount
  const destroy = useCallback(() => {
    isMountedRef.current = false;
    cleanup();
    // Clear any active toasts
    if (activeToastRef.current) {
      toast({
        title: "",
        description: "",
        open: false,
      });
    }
  }, [toast]);

  return {
    isGenerating: generationState.status === 'generating',
    error: generationState.status === 'error' ? generationState.message : null,
    adVariants,
    generationStatus: generationState.status === 'generating' ? generationState.message : "",
    generateAds,
    destroy,
  };
};

