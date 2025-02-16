
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Lightbulb, FolderOpen, Eye, Pencil, Bell, BookOpen, MessageSquare, HelpCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProjectsCard from "@/components/dashboard/ProjectsCard";
import AdStatsCard from "@/components/dashboard/AdStatsCard";
import CreditsCard from "@/components/dashboard/CreditsCard";
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog";
import { formatDistanceToNow } from "date-fns";

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
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      return data;
    },
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

  return (
    <>
      <OnboardingDialog />
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
          {lastAccessedProject && (
            <p className="text-muted-foreground">
              Last accessed: {lastAccessedProject.title} {formatDistanceToNow(new Date(lastAccessedProject.updated_at), { addSuffix: true })}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/ad-wizard/new")}>
            <CardHeader>
              <Lightbulb className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Continue Ad Wizard</CardTitle>
              <CardDescription>Resume your business idea validation journey</CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/gallery")}>
            <CardHeader>
              <FolderOpen className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>View Saved Ads</CardTitle>
              <CardDescription>Access all your previously generated ads</CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/projects")}>
            <CardHeader>
              <Plus className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>Start a new business idea validation project</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <ProjectsCard />
          <AdStatsCard />
          <CreditsCard />
        </div>

        {/* Recent Projects */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <h2 className="text-2xl font-bold md:col-span-2 lg:col-span-4">Recent Projects</h2>
          {recentProjects?.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{project.title}</CardTitle>
                <CardDescription>
                  Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/ad-wizard/${project.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" /> View Ads
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resources & Help */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="link" className="w-full justify-start" onClick={() => navigate("/tutorials")}>
                <BookOpen className="h-4 w-4 mr-2" />
                Getting Started with Ad Wizard
              </Button>
              <Button variant="link" className="w-full justify-start" onClick={() => navigate("/faq")}>
                <HelpCircle className="h-4 w-4 mr-2" />
                FAQs and Support
              </Button>
              <Button variant="link" className="w-full justify-start" onClick={() => navigate("/contact")}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Help Us Improve
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="link" className="w-full justify-start" onClick={() => navigate("/feedback")}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Share Your Feedback
              </Button>
              <Button variant="link" className="w-full justify-start" href="https://trustpilot.com" target="_blank">
                <Star className="h-4 w-4 mr-2" />
                Rate Us on Trustpilot
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
