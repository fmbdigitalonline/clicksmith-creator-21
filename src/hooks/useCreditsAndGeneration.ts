
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
    } finally {
      setIsChecking(false);
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
