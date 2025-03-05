
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const useCredits = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

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
        title: "No credits available",
        description: result.error_message,
        variant: "destructive",
      });
      
      // Navigate to pricing page when credits are exhausted
      navigate('/pricing');
      throw new Error(result.error_message);
    }

    // If this is the last free generation, show a warning toast
    if (result.error_message && result.error_message.includes('Free tier generation')) {
      const [current, total] = result.error_message
        .match(/(\d+)\/(\d+)/)
        ?.slice(1)
        .map(Number) || [0, 0];
      
      if (current === total) {
        toast({
          title: "Last free generation used",
          description: "This was your last free generation. Please upgrade to continue using the service.",
          variant: "warning",
        });
        setTimeout(() => navigate('/pricing'), 2000); // Navigate after showing the toast
      }
    }

    return {
      hasCredits: true,
      errorMessage: result.error_message
    };
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
