
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Lightbulb, FolderOpen, Eye, Pencil, Bell, BookOpen, MessageSquare, HelpCircle, Star, Info, AlertOctagon, ArrowRight, Globe, BookmarkCheck } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProjectsCard from "@/components/dashboard/ProjectsCard";
import AdStatsCard from "@/components/dashboard/AdStatsCard";
import CreditsCard from "@/components/dashboard/CreditsCard";
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle } from "lucide-react";
import { Users, UsersRound, DollarSign, Share2 } from 'lucide-react';
import CreateProjectDialog from "@/components/projects/CreateProjectDialog";
import { useTranslation } from "react-i18next";

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const { t } = useTranslation(["dashboard", "common"]);

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

  // New query for admin updates
  const { data: updates } = useQuery({
    queryKey: ["admin-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_updates")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      return data.map(update => ({
        ...update,
        icon: getUpdateIcon(update.type)
      }));
    }
  });

  // Helper function to get the appropriate icon based on update type
  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return Lightbulb;
      case 'incident':
        return AlertOctagon;
      case 'announcement':
        return Bell;
      default:
        return Info;
    }
  };

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

  const handleProjectClick = (projectId: string) => {
    console.log('Attempting to navigate to project:', projectId);
    navigate(`/projects/${projectId}`);
  };

  const handleProjectSuccess = (projectId: string) => {
    queryClient.invalidateQueries({ queryKey: ['recent-projects'] });
    queryClient.invalidateQueries({ queryKey: ['projectStats'] });
  };

  const handleStartAdWizard = (projectId?: string) => {
    if (projectId) {
      navigate(`/ad-wizard/${projectId}`);
    } else {
      navigate("/ad-wizard/new");
    }
  };

  return (
    <>
      <OnboardingDialog />
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section with Hero Image */}
        <div className="relative mb-8 rounded-lg overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src="photo-1488590528505-98d2b5aba04b" 
              alt=""
              className="w-full h-full object-cover opacity-5"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-transparent" />
          </div>
          <div className="relative z-10 p-8">
            <h1 className="text-4xl font-bold mb-2">{t("welcome")}, {userName}!</h1>
            {lastAccessedProject && (
              <p className="text-muted-foreground text-lg">
                {t("last_accessed", "Last accessed", { ns: "common" })}: {lastAccessedProject.title} {formatDistanceToNow(new Date(lastAccessedProject.updated_at), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions with Enhanced Visual Design */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10" onClick={() => navigate("/ad-wizard/new")}>
            <CardHeader>
              <Lightbulb className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>{t("cards.continue_wizard")}</CardTitle>
              <CardDescription>{t("cards.resume_journey")}</CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-500/5 to-blue-500/10" onClick={() => navigate("/saved-ads")}>
            <CardHeader>
              <FolderOpen className="h-8 w-8 mb-2 text-blue-500" />
              <CardTitle>{t("cards.view_saved_ads")}</CardTitle>
              <CardDescription>{t("cards.access_ads")}</CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-green-500/5 to-green-500/10" onClick={() => setIsCreateProjectOpen(true)}>
            <CardHeader>
              <Plus className="h-8 w-8 mb-2 text-green-500" />
              <CardTitle>{t("cards.create_project")}</CardTitle>
              <CardDescription>{t("cards.start_validation")}</CardDescription>
            </CardHeader>
          </Card>
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

        {/* Message Board - Now using dynamic data */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t("updates.latest")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {updates?.map((update) => {
              const UpdateIcon = update.icon;
              return (
                <Card key={update.id} className={`
                  hover:shadow-md transition-shadow
                  ${update.type === 'incident' ? 'border-destructive/20' : ''}
                  ${update.type === 'feature' ? 'border-primary/20' : ''}
                `}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <UpdateIcon className={`
                        h-5 w-5
                        ${update.type === 'incident' ? 'text-destructive' : ''}
                        ${update.type === 'feature' ? 'text-primary' : ''}
                      `} />
                      <CardTitle className="text-lg">{update.title}</CardTitle>
                    </div>
                    <CardDescription>
                      {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{update.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="grid gap-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-primary" />
              {t("recent.projects")}
            </h2>
            <Button variant="ghost" className="gap-2" onClick={() => navigate("/projects")}>
              {t("view_all", "View All", { ns: "common" })} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentProjects?.map((project) => (
              <Card 
                key={project.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  console.log('Card clicked for project:', project.id);
                  handleProjectClick(project.id);
                }}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <CardDescription>
                    {t("updated", "Updated", { ns: "common" })} {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Edit button clicked for project:', project.id);
                        navigate(`/projects/${project.id}`);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" /> {t("edit", "Edit", { ns: "common" })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('View Ads button clicked for project:', project.id);
                        navigate(`/ad-wizard/${project.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" /> {t("view_ads", "View Ads", { ns: "common" })}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Saved Ads */}
        <div className="grid gap-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookmarkCheck className="h-6 w-6 text-primary" />
              {t("recently_saved_ads", "Recently Saved Ads", { ns: "gallery" })}
            </h2>
            <Button variant="ghost" className="gap-2" onClick={() => navigate("/saved-ads")}>
              {t("view_all", "View All", { ns: "common" })} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentSavedAds?.map((ad) => (
              <Card key={ad.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{ad.headline || t("untitled_ad", "Untitled Ad", { ns: "gallery" })}</CardTitle>
                  <CardDescription>
                    {t("saved", "Saved", { ns: "common" })} {formatDistanceToNow(new Date(ad.created_at), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/saved-ads`)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> {t("view", "View", { ns: "common" })}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Resources, Help & Share */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-background to-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {t("resources", "Resources", { ns: "common" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="link" className="w-full justify-start" onClick={() => navigate("/faq")}>
                <BookOpen className="h-4 w-4 mr-2" />
                {t("getting_started", "Getting Started with Ad Wizard", { ns: "adwizard" })}
              </Button>
              <Button variant="link" className="w-full justify-start" onClick={() => navigate("/faq")}>
                <HelpCircle className="h-4 w-4 mr-2" />
                {t("faq_support", "FAQs and Support", { ns: "adwizard" })}
              </Button>
              <Button variant="link" className="w-full justify-start" onClick={() => navigate("/contact")}>
                <MessageSquare className="h-4 w-4 mr-2" />
                {t("contact_support", "Contact Support", { ns: "common" })}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-background to-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                {t("help_improve", "Help Us Improve", { ns: "common" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="link" className="w-full justify-start" onClick={() => navigate("/contact")}>
                <MessageSquare className="h-4 w-4 mr-2" />
                {t("share_feedback", "Share Your Feedback", { ns: "common" })}
              </Button>
              <Button asChild variant="link" className="w-full justify-start">
                <a href="https://trustpilot.com" target="_blank" rel="noopener noreferrer">
                  <Star className="h-4 w-4 mr-2" />
                  {t("rate_us", "Rate Us on Trustpilot", { ns: "common" })}
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-background to-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {t("share_earn", "Share & Earn", { ns: "common" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="link" className="w-full justify-start" onClick={() => navigate("/referral")}>
                <UsersRound className="h-4 w-4 mr-2" />
                {t("refer_friend", "Refer a Friend", { ns: "common" })}
              </Button>
              <Button variant="link" className="w-full justify-start" onClick={() => navigate("/affiliate")}>
                <DollarSign className="h-4 w-4 mr-2" />
                {t("affiliate_program", "Affiliate Program", { ns: "common" })}
              </Button>
              <Button variant="link" className="w-full justify-start" onClick={() => navigate("/share")}>
                <Share2 className="h-4 w-4 mr-2" />
                {t("share_social", "Share on Social Media", { ns: "common" })}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add CreateProjectDialog component */}
      <CreateProjectDialog
        open={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
        onSuccess={handleProjectSuccess}
        onStartAdWizard={handleStartAdWizard}
      />
    </>
  );
};

export default Dashboard;
