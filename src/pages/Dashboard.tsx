import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart, Activity, Image, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: projectStats } = useQuery({
    queryKey: ["projectStats"],
    queryFn: async () => {
      const { data: projects, error } = await supabase
        .from("projects")
        .select("status, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error fetching projects",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      return {
        total: projects.length,
        completed: projects.filter(p => p.status === "completed").length,
        inProgress: projects.filter(p => p.status === "in_progress").length,
      };
    },
  });

  const { data: adStats } = useQuery({
    queryKey: ["adStats"],
    queryFn: async () => {
      const { data: images, error: imagesError } = await supabase
        .from("ad_image_variants")
        .select("created_at");

      const { data: feedback, error: feedbackError } = await supabase
        .from("ad_feedback")
        .select("rating");

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

  const { data: credits } = useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("credits_remaining")
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
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button 
            onClick={() => navigate("/ad-wizard/new")} 
            className="w-full sm:w-auto whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" /> New Ad Campaign
          </Button>
          <Button 
            onClick={() => navigate("/projects")}
            variant="outline"
            className="w-full sm:w-auto whitespace-nowrap"
          >
            View All Projects
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats?.total || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {projectStats?.completed || 0} completed · {projectStats?.inProgress || 0} in progress
            </div>
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
};

export default Dashboard;