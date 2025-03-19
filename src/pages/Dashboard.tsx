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

        <

