
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GenerationResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface CreditsCheckResult {
  hasCredits: boolean;
  creditsRemaining?: number;
  errorMessage?: string;
}

export const useCreditsAndGeneration = () => {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkCreditsAvailable = async (requiredCredits: number = 1): Promise<CreditsCheckResult> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { hasCredits: false, errorMessage: "Please sign in to continue" };
      }

      const { data, error } = await supabase.rpc(
        'check_credits_available',
        { p_user_id: user.id, required_credits: requiredCredits }
      );

      if (error) throw error;
      
      const [result] = data;
      return {
        hasCredits: result.has_credits,
        creditsRemaining: result.credits_remaining,
        errorMessage: result.error_message
      };
    } catch (error) {
      console.error('Error checking credits:', error);
      return {
        hasCredits: false,
        errorMessage: 'Failed to check credits availability'
      };
    }
  };

  const deductCredits = async (requiredCredits: number = 1) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc(
        'deduct_generation_credits',
        { p_user_id: user.id, required_credits: requiredCredits }
      );

      if (error) throw error;
      
      const [result] = data;
      return {
        success: result.success,
        creditsRemaining: result.credits_remaining,
        errorMessage: result.error_message
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
      setIsChecking(true);
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
      throw error; // Let the caller handle the error
    } finally {
      setIsChecking(false);
    }
  };

  return {
    isChecking,
    generateWithCredits,
    checkCreditsAvailable,
  };
};
