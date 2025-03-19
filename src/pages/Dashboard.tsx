
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
  const { t } = useTranslation('dashboard');

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
            <h1 className="text-4xl font-bold mb-2">{t('greeting', { userName })}</h1>
            {lastAccessedProject && (
              <p className="text-muted-foreground text-lg">
                {t('last_accessed', { 
                  projectTitle: lastAccessedProject.title,
                  timeAgo: formatDistanceToNow(new Date(lastAccessedProject.updated_at), { addSuffix: true })
                })}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ProjectsCard />
          <AdStatsCard />
          <CreditsCard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('quick_actions.title')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button 
                className="h-auto flex flex-col items-center justify-center py-6 space-y-2"
                variant="outline"
                onClick={() => setIsCreateProjectOpen(true)}
              >
                <Plus className="h-8 w-8 mb-2 text-primary" />
                <div className="text-center">
                  <h3 className="font-medium">{t('quick_actions.new_project')}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t('create_new_project')}</p>
                </div>
              </Button>
              
              <Button 
                className="h-auto flex flex-col items-center justify-center py-6 space-y-2"
                variant="outline"
                onClick={() => handleStartAdWizard()}
              >
                <Lightbulb className="h-8 w-8 mb-2 text-amber-500" />
                <div className="text-center">
                  <h3 className="font-medium">{t('continue_wizard')}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t('resume_journey')}</p>
                </div>
              </Button>
              
              <Button 
                className="h-auto flex flex-col items-center justify-center py-6 space-y-2"
                variant="outline"
                onClick={() => navigate('/gallery')}
              >
                <Eye className="h-8 w-8 mb-2 text-blue-500" />
                <div className="text-center">
                  <h3 className="font-medium">{t('view_saved_ads')}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t('access_generated_ads')}</p>
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('updates.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {updates && updates.length > 0 ? (
                updates.map((update, index) => {
                  const Icon = update.icon;
                  return (
                    <div key={update.id} className="flex space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{update.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{update.description}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">{t('no_updates')}</p>
                </div>
              )}
              {updates && updates.length > 0 && (
                <Button 
                  variant="link" 
                  className="w-full mt-2"
                  onClick={() => navigate('/updates')}
                >
                  {t('updates.view_all')}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('recent_projects.title')}</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/projects')}
              >
                {t('recent_projects.view_all')}
              </Button>
            </CardHeader>
            <CardContent>
              {recentProjects && recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div 
                      key={project.id} 
                      className="flex items-start justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleProjectClick(project.id)}
                    >
                      <div className="flex space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <FolderOpen className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">{project.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('recent_projects.updated', { 
                              timeAgo: formatDistanceToNow(new Date(project.updated_at), { addSuffix: true }) 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${project.id}`);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">{t('recent_projects.actions.edit')}</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/gallery?project=${project.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">{t('recent_projects.actions.view_ads')}</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('recent.no_data')}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsCreateProjectOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('create_new_project')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('saved_ads.title')}</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/gallery')}
              >
                {t('saved_ads.view_all')}
              </Button>
            </CardHeader>
            <CardContent>
              {recentSavedAds && recentSavedAds.length > 0 ? (
                <div className="space-y-4">
                  {recentSavedAds.map((ad) => (
                    <div 
                      key={ad.id} 
                      className="flex items-start justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/gallery?ad=${ad.id}`)}
                    >
                      <div className="flex space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <BookmarkCheck className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">{ad.title || t('saved_ads.untitled')}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('saved_ads.saved', { 
                              timeAgo: formatDistanceToNow(new Date(ad.created_at), { addSuffix: true }) 
                            })}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">{t('saved_ads.view')}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('recent.no_data')}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => handleStartAdWizard()}
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    {t('continue_wizard')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateProjectDialog 
        open={isCreateProjectOpen} 
        onOpenChange={setIsCreateProjectOpen}
        onSuccess={handleProjectSuccess}
      />
    </>
  );
};

export default Dashboard;
