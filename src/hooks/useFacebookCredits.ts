
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useFacebookCredits = () => {
  const { toast } = useToast();

  // Function to check if user has enough credits for Facebook operations
  const checkFacebookCredits = async (requiredCredits: number = 5) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Call the Supabase RPC function to check credits
      const { data, error } = await supabase.rpc(
        'check_credits_available',
        { p_user_id: user.id, required_credits: requiredCredits }
      );

      if (error) {
        toast({
          title: "Error checking credits",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      // Result should contain has_credits, credits_remaining, and error_message
      if (!data || !data[0].has_credits) {
        toast({
          title: "Insufficient credits",
          description: data[0].error_message || "You don't have enough credits for this operation.",
          variant: "warning",
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking Facebook credits:", error);
      toast({
        title: "Error",
        description: "Failed to check available credits",
        variant: "destructive",
      });
      return false;
    }
  };

  // Query to get user's current Facebook usage statistics
  const { data: facebookUsage, isLoading: isLoadingUsage } = useQuery({
    queryKey: ["facebook_usage"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("id, created_at, status")
        .eq("user_id", user.id)
        .eq("platform", "facebook");

      if (error) {
        throw error;
      }

      return {
        totalCampaigns: data.length,
        activeCampaigns: data.filter(c => c.status === "active").length,
        draftCampaigns: data.filter(c => c.status === "draft").length,
      };
    },
    enabled: false, // Only load when needed
  });

  return {
    checkFacebookCredits,
    facebookUsage,
    isLoadingUsage,
  };
};
