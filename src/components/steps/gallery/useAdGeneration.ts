
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

export const useAdGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adVariants, setAdVariants] = useState<AdVariant[]>([]);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const { toast } = useToast();
  const { generateWithCredits } = useCreditsAndGeneration();

  // Track the current request's AbortController
  const abortControllerRef = useRef<AbortController | null>(null);
  // Track the debounce timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track if component is mounted
  const isMountedRef = useRef(true);

  // Cleanup function
  const cleanup = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Function to handle network errors with exponential backoff
  const handleNetworkError = (error: any, retryCount: number = 0) => {
    const isNetworkError = error.message?.includes('network') || error.message?.includes('fetch');
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    if (isNetworkError && retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`Retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      return new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw error;
  };

  const generateAds = useCallback(async (platform: string) => {
    // Don't start a new request if one is already in progress
    if (isGenerating) {
      console.log('Generation already in progress, skipping request');
      return null;
    }

    // Cleanup any existing request
    cleanup();

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Clear any existing errors
    setError(null);

    // Start generation with debouncing
    return new Promise((resolve) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return null;

        setIsGenerating(true);
        setGenerationStatus("Generating ads...");

        let retryCount = 0;
        
        try {
          const result = await generateWithCredits<AdVariant[]>(
            async () => {
              try {
                const { data, error: functionError } = await supabase.functions.invoke(
                  'generate-ad-content',
                  {
                    body: {
                      platform,
                      timestamp: new Date().getTime()
                    },
                    signal, // Pass the abort signal
                  }
                );

                if (signal.aborted) {
                  throw new Error('Request was cancelled');
                }

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
                  await handleNetworkError(error, retryCount++);
                  // If we get here, retry the request
                  return generateAds(platform);
                }

                const errorMessage = error instanceof Error ? error.message : 'Failed to generate ads';
                return { success: false, error: errorMessage };
              }
            },
            1 // Required credits for generation
          );

          if (!isMountedRef.current) return null;

          if (!result) {
            setError('Failed to generate ads');
            return null;
          }

          setAdVariants(result);
          
          toast({
            title: "Ads Generated Successfully",
            description: "Your ads have been created and credits have been deducted.",
          });

          resolve(result);
        } catch (error) {
          if (!isMountedRef.current) return null;

          console.error('Final error in generation:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
          
          setError(errorMessage);
          toast({
            title: "Generation Failed",
            description: errorMessage,
            variant: "destructive",
          });

          resolve(null);
        } finally {
          if (isMountedRef.current) {
            setIsGenerating(false);
            setGenerationStatus("");
          }
        }
      }, 500); // 500ms debounce delay
    });
  }, [generateWithCredits, isGenerating, toast]);

  // Cleanup on unmount
  const destroy = useCallback(() => {
    isMountedRef.current = false;
    cleanup();
  }, []);

  return {
    isGenerating,
    error,
    adVariants,
    generationStatus,
    generateAds,
    destroy,
  };
};
