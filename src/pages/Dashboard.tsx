
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CreditsCard from "@/components/dashboard/CreditsCard";
import ProjectsCard from "@/components/dashboard/ProjectsCard";
import AdStatsCard from "@/components/dashboard/AdStatsCard";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: recentProjects } = useQuery({
    queryKey: ["recentProjects"],
    queryFn: async () => {
      const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return projects;
    }
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        <CreditsCard />
        <ProjectsCard />
        <AdStatsCard />
      </div>

      {/* Recent Projects */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Recent Projects</CardTitle>
            <Button
              variant="ghost"
              className="text-sm"
              onClick={() => navigate("/projects")}
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects?.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <h3 className="font-medium">{project.title}</h3>
                  <p className="text-sm text-gray-500">
                    Updated {formatDistanceToNow(new Date(project.updated_at))} ago
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  View Details
                </Button>
              </div>
            ))}
            {(!recentProjects || recentProjects.length === 0) && (
              <p className="text-center text-gray-500 py-4">
                No recent projects found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
