import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CreditsCard = () => {
  const { data: credits, isLoading } = useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      // Check if user is admin
      if (user.email === 'info@fmbonline.nl') {
        return -1; // Special value for unlimited credits
      }

      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("credits_remaining")
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching credits:", error);
        return 0;
      }

      // Check free tier if no subscription
      if (!subscription) {
        const { data: freeUsage, error: freeError } = await supabase
          .from("free_tier_usage")
          .select("generations_used")
          .eq("user_id", user.id)
          .maybeSingle();

        if (freeError && freeError.code !== "PGRST116") {
          console.error("Error fetching free tier usage:", freeError);
          return 0;
        }

        const usedGenerations = freeUsage?.generations_used || 0;
        return 12 - usedGenerations; // 12 is the free tier limit
      }

      return subscription?.credits_remaining || 0;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? "..." : credits === -1 ? "∞" : credits}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {credits === -1 ? "Unlimited credits available" : "Available for new campaigns"}
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditsCard;