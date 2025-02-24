
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GenerationResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const useCreditsAndGeneration = () => {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkCreditsAvailable = async (requiredCredits: number = 1) => {
    setIsChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { hasCredits: false, errorMessage: "Please sign in to continue" };
      }

      // Special case for admin
      if (user.email === "info@fmbonline.nl") {
        return {
          hasCredits: true,
          creditsRemaining: -1, // Indicates unlimited
          errorMessage: null
        };
      }

      // First check subscription credits
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("credits_remaining")
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (subscriptionError && subscriptionError.code !== "PGRST116") {
        throw subscriptionError;
      }

      if (subscriptionData?.credits_remaining >= requiredCredits) {
        return {
          hasCredits: true,
          creditsRemaining: subscriptionData.credits_remaining,
          errorMessage: null
        };
      }

      // If no subscription or not enough credits, check free tier
      const { data: freeUsageData, error: freeUsageError } = await supabase
        .from("free_tier_usage")
        .select("generations_used")
        .eq("user_id", user.id)
        .maybeSingle();

      if (freeUsageError && freeUsageError.code !== "PGRST116") {
        throw freeUsageError;
      }

      const usedGenerations = freeUsageData?.generations_used || 0;
      const remainingFreeGenerations = Math.max(0, 3 - usedGenerations); // Cap at 3 free generations

      if (remainingFreeGenerations >= requiredCredits) {
        return {
          hasCredits: true,
          creditsRemaining: remainingFreeGenerations,
          errorMessage: null
        };
      }

      return {
        hasCredits: false,
        creditsRemaining: remainingFreeGenerations,
        errorMessage: "You have used all your free generations. Please upgrade to continue."
      };
      
    } catch (error) {
      console.error('Error checking credits:', error);
      return {
        hasCredits: false,
        errorMessage: 'Failed to check credits availability'
      };
    } finally {
      setIsChecking(false);
    }
  };

  const deductCredits = async (requiredCredits: number = 1) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Special case for admin
      if (user.email === "info@fmbonline.nl") {
        return {
          success: true,
          creditsRemaining: -1,
          errorMessage: null
        };
      }

      // First try to deduct from subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("credits_remaining")
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (!subscriptionError && subscriptionData?.credits_remaining >= requiredCredits) {
        // Deduct from subscription
        const { data: updateData, error: updateError } = await supabase
          .from("subscriptions")
          .update({ credits_remaining: subscriptionData.credits_remaining - requiredCredits })
          .eq("user_id", user.id)
          .eq("active", true);

        if (updateError) throw updateError;

        return {
          success: true,
          creditsRemaining: subscriptionData.credits_remaining - requiredCredits,
          errorMessage: null
        };
      }

      // If no subscription or not enough credits, use free tier
      const { data: freeUsageData, error: freeUsageError } = await supabase
        .from("free_tier_usage")
        .select("generations_used")
        .eq("user_id", user.id)
        .maybeSingle();

      if (freeUsageError) throw freeUsageError;

      const currentUsed = freeUsageData?.generations_used || 0;
      
      if (currentUsed < 3) { // Still have free generations available
        const { data: updateData, error: updateError } = await supabase
          .from("free_tier_usage")
          .upsert({
            user_id: user.id,
            generations_used: currentUsed + requiredCredits
          });

        if (updateError) throw updateError;

        return {
          success: true,
          creditsRemaining: 3 - (currentUsed + requiredCredits),
          errorMessage: null
        };
      }

      return {
        success: false,
        creditsRemaining: 0,
        errorMessage: "No credits available"
      };
    } catch (error) {
      console.error('Error deducting credits:', error);
      throw error;
    }
  };

  const generateWithCredits = async <T,>(
    generateFn: () => Promise<GenerationResponse>,
    requiredCredits: number = 1
  ): Promise<T | null> => {
    try {
      // First check if credits are available
      const { hasCredits, errorMessage } = await checkCreditsAvailable(requiredCredits);
      
      if (!hasCredits) {
        toast({
          title: "Insufficient Credits",
          description: errorMessage || "Please upgrade to continue generating",
          variant: "destructive",
        });
        return null;
      }

      // Generate the content
      const { success, data, error } = await generateFn();
      
      if (!success || error) {
        throw new Error(error || 'Generation failed');
      }

      // Only deduct credits after successful generation
      const deductResult = await deductCredits(requiredCredits);
      
      if (!deductResult.success) {
        throw new Error(deductResult.errorMessage || 'Failed to deduct credits');
      }

      return data as T;
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    isChecking,
    generateWithCredits,
    checkCreditsAvailable,
  };
};
