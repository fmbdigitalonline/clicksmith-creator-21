
import { useQuery } from "@tanstack/react-query";
import { Image, Type } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const AdStatsCard = () => {
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
        .select("primary_text, rating")
        .eq('user_id', user.id);

      if (imagesError || feedbackError) {
        toast({
          title: "Error fetching ad stats",
          description: "Could not load ad statistics",
          variant: "destructive",
        });
        return null;
      }

      const uniquePrimaryTexts = new Set(feedback?.map(f => f.primary_text).filter(Boolean));

      return {
        totalImages: images?.length || 0,
        totalPrimaryTexts: uniquePrimaryTexts.size,
        avgRating: feedback?.length 
          ? (feedback.reduce((acc, curr) => acc + (curr.rating || 0), 0) / feedback.length).toFixed(1)
          : "N/A",
      };
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Generated Content</CardTitle>
        <Image className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Images</span>
            </div>
            <span className="text-2xl font-bold">{adStats?.totalImages || 0}</span>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Primary Texts</span>
            </div>
            <span className="text-2xl font-bold">{adStats?.totalPrimaryTexts || 0}</span>
          </div>

          <div className="text-xs text-muted-foreground mt-1">
            Average rating: {adStats?.avgRating}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdStatsCard;
