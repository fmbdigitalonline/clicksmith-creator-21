import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Lightbulb, FolderOpen, Eye, Pencil, Bell, Info, ArrowRight, Globe, BookmarkCheck } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProjectsCard from "@/components/dashboard/ProjectsCard";
import AdStatsCard from "@/components/dashboard/AdStatsCard";
import CreditsCard from "@/components/dashboard/CreditsCard";
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      return { user, profile };
    },
  });

  const { data: recentProjects } = useQuery({
    queryKey: ["recent-projects"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!userData?.user,
  });

  const { data: recentLandingPages } = useQuery({
    queryKey: ["recent-landing-pages"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!userData?.user,
  });

  const { data: recentSavedAds } = useQuery({
    queryKey: ["recent-saved-ads"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("ad_feedback")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!userData?.user,
  });

  useEffect(() => {
    const setupRealtimeSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to projects changes
      const projectsChannel = supabase
        .channel('public:projects')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'projects',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['projectStats'] });
          }
        )
        .subscribe();

      // Subscribe to ad_image_variants changes
      const adImagesChannel = supabase
        .channel('public:ad_image_variants')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'ad_image_variants',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['adStats'] });
          }
        )
        .subscribe();

      // Subscribe to ad_feedback changes
      const feedbackChannel = supabase
        .channel('public:ad_feedback')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'ad_feedback',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['adStats'] });
          }
        )
        .subscribe();

      // Subscribe to subscriptions changes
      const subscriptionsChannel = supabase
        .channel('public:subscriptions')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'subscriptions',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['credits'] });
          }
        )
        .subscribe();

      // Cleanup subscriptions
      return () => {
        supabase.removeChannel(projectsChannel);
        supabase.removeChannel(adImagesChannel);
        supabase.removeChannel(feedbackChannel);
        supabase.removeChannel(subscriptionsChannel);
      };
    };

    setupRealtimeSubscriptions();
  }, [queryClient]);

  const userName = userData?.profile?.full_name || userData?.user?.email?.split('@')[0] || "there";
  const lastAccessedProject = recentProjects?.[0];

  // Simplified updates data
  const updates = [
    {
      id: 1,
      type: "feature",
      title: "New Feature: Enhanced AI Image Generation",
      description: "We've upgraded our AI image generation capabilities for even better results!",
      date: "2024-02-10",
      icon: Lightbulb
    },
    {
      id: 2,
      type: "update",
      title: "Platform Update",
      description: "Performance improvements and bug fixes for a smoother experience.",
      date: "2024-02-08",
      icon: Info
    }
  ];

  return (
    <>
      <OnboardingDialog />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Welcome Section with simplified design */}
        <div className="bg-gradient-to-r from-background to-muted p-6 rounded-lg mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
          {lastAccessedProject && (
            <p className="text-muted-foreground">
              Last project: {lastAccessedProject.title} ({formatDistanceToNow(new Date(lastAccessedProject.updated_at), { addSuffix: true })})
            </p>
          )}
        </div>

        {/* Main Action Cards - Keep these prominent */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10" onClick={() => navigate("/ad-wizard/new")}>
            <CardHeader>
              <Lightbulb className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Continue Ad Wizard</CardTitle>
              <CardDescription>Resume your business idea validation journey</CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-500/5 to-blue-500/10" onClick={() => navigate("/saved-ads")}>
            <CardHeader>
              <FolderOpen className="h-8 w-8 mb-2 text-blue-500" />
              <CardTitle>View Saved Ads</CardTitle>
              <CardDescription>Access all your previously generated ads</CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-green-500/5 to-green-500/10" onClick={() => navigate("/projects")}>
            <CardHeader>
              <Plus className="h-8 w-8 mb-2 text-green-500" />
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>Start a new business idea validation project</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Stats Row - Simplified and compact */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <ProjectsCard />
          <AdStatsCard />
          <CreditsCard />
        </div>

        {/* Recent Activity - Simplified layout */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Projects - Compact list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Projects</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
                View all <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div className="space-y-2">
              {recentProjects?.slice(0, 3).map((project) => (
                <Card key={project.id} className="cursor-pointer hover:bg-accent/5" onClick={() => navigate(`/projects/${project.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Updates - Compact list */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Latest Updates
            </h2>
            <div className="space-y-2">
              {updates.map((update) => (
                <Card key={update.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <update.icon className={`h-5 w-5 mt-1 ${update.type === 'feature' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <h3 className="font-medium">{update.title}</h3>
                        <p className="text-sm text-muted-foreground">{update.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(update.date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
