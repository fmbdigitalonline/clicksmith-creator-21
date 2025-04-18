
import { useQuery } from "@tanstack/react-query";
import { BarChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const ProjectsCard = () => {
  const { toast } = useToast();
  const { t } = useTranslation(["dashboard", "common", "projects"]);

  const { data: projectStats } = useQuery({
    queryKey: ["projectStats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: projects, error } = await supabase
        .from("projects")
        .select("status, created_at")
        .eq('user_id', user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: t("error_fetching_projects", { ns: "projects" }),
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t("summary.projects")}</CardTitle>
        <BarChart className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{projectStats?.total || 0}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {projectStats?.completed || 0} {t("completed")} · {projectStats?.inProgress || 0} {t("in_progress")}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectsCard;
