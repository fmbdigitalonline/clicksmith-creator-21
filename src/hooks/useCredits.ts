import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCredits = () => {
  const { toast } = useToast();

  const checkCredits = async (requiredCredits: number = 1) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: creditCheck, error } = await supabase.rpc(
      'check_user_credits',
      { p_user_id: user.id, required_credits: requiredCredits }
    );

    if (error) {
      toast({
        title: "Error checking credits",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    // Properly access the first element of the returned array
    const result = creditCheck[0];
    
    if (!result.has_credits) {
      toast({
        title: "Insufficient credits",
        description: result.error_message,
        variant: "destructive",
      });
      throw new Error(result.error_message);
    }

    return true;
  };

  const { data: freeUsage } = useQuery({
    queryKey: ["free_tier_usage"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("free_tier_usage")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        toast({
          title: "Error fetching free tier usage",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      return data;
    },
  });

  return {
    checkCredits,
    freeUsage,
  };
};