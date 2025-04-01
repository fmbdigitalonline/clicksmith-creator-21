import { useQuery } from "@tanstack/react-query";
import { BarChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const ProjectsCard = () => {
  const { toast } = useToast();

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

  return (
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
  );
};

export default ProjectsCard;