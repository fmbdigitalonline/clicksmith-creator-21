import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useAdValidation = () => {
  const { toast } = useToast();

  const checkCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: creditCheck, error } = await supabase.rpc(
      'check_user_credits',
      { p_user_id: user.id, required_credits: 1 }
    );

    if (error) {
      throw error;
    }

    const result = creditCheck[0];
    
    if (!result.has_credits) {
      toast({
        title: "No credits available",
        description: result.error_message,
        variant: "destructive",
      });
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

    return variants;
  };

  return {
    checkCredits,
    validateResponse
  };
};