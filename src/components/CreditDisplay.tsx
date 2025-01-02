import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const CreditDisplay = () => {
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true)
        .single();

      if (error) {
        toast({
          title: "Error fetching subscription",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  const { data: freeUsage } = useQuery({
    queryKey: ["free_tier_usage", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
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
    enabled: !!user?.id,
  });

  const getCreditsDisplay = () => {
    if (!user) return "";

    // Check if user is admin (info@fmbonline.nl)
    if (user.email === "info@fmbonline.nl") {
      return "Unlimited credits";
    }

    if (subscription?.credits_remaining !== undefined) {
      return `${subscription.credits_remaining} credits`;
    }
    
    const freeUsed = freeUsage?.generations_used || 0;
    const freeRemaining = 12 - freeUsed;
    return `${freeRemaining}/12 free generations`;
  };

  return (
    <div className="text-sm font-medium">
      {getCreditsDisplay()}
    </div>
  );
};