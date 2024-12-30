import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export const CreditsCard = () => {
  const { toast } = useToast();

  const { data: credits } = useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("credits_remaining")
        .eq("user_id", user.id)
        .eq("active", true)
        .single();

      if (error) {
        if (error.code !== "PGRST116") { // No rows returned is expected for free tier
          toast({
            title: "Error fetching credits",
            description: error.message,
            variant: "destructive",
          });
        }
        return 0;
      }

      return subscription?.credits_remaining || 0;
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{credits}</div>
        <div className="text-xs text-muted-foreground mt-1">
          Available for new campaigns
        </div>
      </CardContent>
    </Card>
  );
};