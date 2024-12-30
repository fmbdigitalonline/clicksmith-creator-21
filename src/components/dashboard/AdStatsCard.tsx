import { useQuery } from "@tanstack/react-query";
import { Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export const AdStatsCard = () => {
  const { toast } = useToast();

  const { data: adStats } = useQuery({
    queryKey: ["adStats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: images, error: imagesError } = await supabase
        .from("ad_image_variants")
        .select("created_at")
        .eq('user_id', user.id);

      const { data: feedback, error: feedbackError } = await supabase
        .from("ad_feedback")
        .select("rating")
        .eq('user_id', user.id);

      if (imagesError || feedbackError) {
        toast({
          title: "Error fetching ad stats",
          description: "Could not load ad statistics",
          variant: "destructive",
        });
        return null;
      }

      return {
        totalAds: images?.length || 0,
        avgRating: feedback?.length 
          ? (feedback.reduce((acc, curr) => acc + (curr.rating || 0), 0) / feedback.length).toFixed(1)
          : "N/A",
      };
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Generated Ads</CardTitle>
        <Image className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{adStats?.totalAds || 0}</div>
        <div className="text-xs text-muted-foreground mt-1">
          Average rating: {adStats?.avgRating}
        </div>
      </CardContent>
    </Card>
  );
};