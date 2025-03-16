
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BusinessIdea, EnhancedPersona } from "@/types/adWizard";

interface UseEnhancedPersonaGenerationProps {
  onSuccess?: (personas: EnhancedPersona[]) => void;
  onError?: (error: Error) => void;
}

export function useEnhancedPersonaGeneration({
  onSuccess,
  onError,
}: UseEnhancedPersonaGenerationProps = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [personas, setPersonas] = useState<EnhancedPersona[]>([]);
  const { toast } = useToast();

  const generateEnhancedPersonas = async (
    businessIdea: BusinessIdea,
    regenerationCount = 0,
    forceRegenerate = false
  ) => {
    try {
      setLoading(true);
      setError(null);

      // First check if the user has credits
      const { data: creditCheck } = await supabase.rpc('check_credits_available', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        required_credits: 1
      });

      if (!creditCheck?.has_credits) {
        throw new Error(creditCheck?.error_message || 'Insufficient credits');
      }

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke<{ personas: EnhancedPersona[] }>(
        "generate-enhanced-personas",
        {
          body: {
            businessIdea,
            regenerationCount,
            forceRegenerate,
          },
        }
      );

      if (error) {
        console.error("Error generating enhanced personas:", error);
        throw new Error(`Failed to generate personas: ${error.message}`);
      }

      if (!data?.personas || !Array.isArray(data.personas)) {
        throw new Error("Invalid response format: personas data is missing or invalid");
      }

      // Deduct credits
      await supabase.rpc('deduct_generation_credits', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        required_credits: 1
      });

      setPersonas(data.personas);
      
      if (onSuccess) {
        onSuccess(data.personas);
      }
      
      return data.personas;
    } catch (err) {
      console.error("Error in generateEnhancedPersonas:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      
      setError(err instanceof Error ? err : new Error(errorMessage));
      
      toast({
        title: "Error Generating Personas",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const regenerate = async (
    businessIdea: BusinessIdea,
    regenerationCount: number
  ) => {
    return generateEnhancedPersonas(businessIdea, regenerationCount, true);
  };

  return {
    loading,
    error,
    personas,
    generateEnhancedPersonas,
    regenerate,
  };
}
