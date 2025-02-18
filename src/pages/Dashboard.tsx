
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Lightbulb, FolderOpen, Eye, Pencil, Bell, BookOpen, MessageSquare, HelpCircle, Star, Info, AlertOctagon, ArrowRight, Globe, BookmarkCheck } from "lucide-react";
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
import { Users, UsersRound, DollarSign, Share2 } from 'lucide-react';
import { FacebookAuthButton } from "@/components/facebook/FacebookAuthButton";

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

  const userName = userData?.profile?.full_name || userData?.user?.email?.split('@')[0] || "there";
  const lastAccessedProject = recentProjects?.[0];

  return (
    <>
      <OnboardingDialog />
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="relative mb-8 rounded-lg overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5 p-8">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">Welcome back, {userName}!</h1>
            {lastAccessedProject && (
              <p className="text-muted-foreground text-lg">
                Last accessed: {lastAccessedProject.title} {formatDistanceToNow(new Date(lastAccessedProject.updated_at), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/ad-wizard/new")}>
            <CardHeader>
              <Lightbulb className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Create New Ad</CardTitle>
              <CardDescription>Start a new ad campaign</CardDescription>
            </CardHeader>
          </Card>
          
          {/* Facebook Integration Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Connect Platform</CardTitle>
              <CardDescription>Link your ad accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <FacebookAuthButton />
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/projects")}>
            <CardHeader>
              <Plus className="h-8 w-8 mb-2 text-green-500" />
              <CardTitle>View Projects</CardTitle>
              <CardDescription>Manage your projects</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <ProjectsCard />
          <AdStatsCard />
          <CreditsCard />
        </div>

        {/* Updates Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Latest Updates
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {updates?.map((update) => {
              const UpdateIcon = update.icon;
              return (
                <Card key={update.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <UpdateIcon className="h-5 w-5 text-primary" />
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
      </div>
    </>
  );
};

export default Dashboard;
