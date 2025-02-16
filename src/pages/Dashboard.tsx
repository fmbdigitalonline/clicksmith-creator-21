
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Lightbulb, FolderOpen, Eye, Pencil, Bell, BookOpen, MessageSquare, HelpCircle, Star, Info, AlertOctagon } from "lucide-react";
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

  // Dummy updates data - this would typically come from your backend
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
    },
    {
      id: 3,
      type: "incident",
      title: "Scheduled Maintenance",
      description: "Brief maintenance window scheduled for Feb 15, 2:00-4:00 UTC.",
      date: "2024-02-07",
      icon: AlertOctagon
    }
  ];

  return (
    <>
      <OnboardingDialog />
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section with Hero Image */}
        <div className="relative mb-8 rounded-lg overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src="photo-1488590528505-98d2b5aba04b" 
              alt="Dashboard Hero"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-transparent" />
          </div>
          <div className="relative z-10 p-8">
            <h1 className="text-4xl font-bold mb-2">Welcome back, {userName}!</h1>
            {lastAccessedProject && (
              <p className="text-muted-foreground text-lg">
                Last accessed: {lastAccessedProject.title} {formatDistanceToNow(new Date(lastAccessedProject.updated_at), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions with Enhanced Visual Design */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10" onClick={() => navigate("/ad-wizard/new")}>
            <CardHeader>
              <Lightbulb className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Continue Ad Wizard</CardTitle>
              <CardDescription>Resume your business idea validation journey</CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-500/5 to-blue-500/10" onClick={() => navigate("/gallery")}>
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

        {/* Message Board */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Latest Updates
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {updates.map((update) => (
              <Card key={update.id} className={`
                hover:shadow-md transition-shadow
                ${update.type === 'incident' ? 'border-destructive/20' : ''}
                ${update.type === 'feature' ? 'border-primary/20' : ''}
              `}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <update.icon className={`
                      h-5 w-5
                      ${update.type === 'incident' ? 'text-destructive' : ''}
                      ${update.type === 'feature' ? 'text-primary' : ''}
                    `} />
                    <CardTitle className="text-lg">{update.title}</CardTitle>
                  </div>
                  <CardDescription>
                    {formatDistanceToNow(new Date(update.date), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{update.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Cards with Enhanced Visual Design */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="bg-gradient-to-br from-background to-muted rounded-lg p-[1px]">
            <ProjectsCard />
          </div>
          <div className="bg-gradient-to-br from-background to-muted rounded-lg p-[1px]">
            <AdStatsCard />
          </div>
          <div className="bg-gradient-to-br from-background to-muted rounded-lg p-[1px]">
            <CreditsCard />
          </div>
        </div>

        {/* Recent Projects with Enhanced Visual Design */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <h2 className="text-2xl font-bold md:col-span-2 lg:col-span-4 flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" />
            Recent Projects
          </h2>
          {recentProjects?.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow bg-gradient-to-br from-background to-muted/50">
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

        {/* Resources & Help with Enhanced Visual Design */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-background to-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
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

          <Card className="bg-gradient-to-br from-background to-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Help Us Improve
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="link" className="w-full justify-start" onClick={() => navigate("/feedback")}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Share Your Feedback
              </Button>
              <Button asChild variant="link" className="w-full justify-start">
                <a href="https://trustpilot.com" target="_blank" rel="noopener noreferrer">
                  <Star className="h-4 w-4 mr-2" />
                  Rate Us on Trustpilot
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
