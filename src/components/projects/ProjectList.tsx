import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, History } from "lucide-react";
import ProjectCard from "./ProjectCard";
import CreateProjectDialog from "./CreateProjectDialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { validateProjectState } from "@/utils/projectValidation";

// Use the database types directly and extend them
type DatabaseProject = Database['public']['Tables']['projects']['Row'];
type Project = Omit<DatabaseProject, 'business_idea' | 'target_audience' | 'audience_analysis' | 'marketing_campaign' | 'generated_ads'> & {
  business_idea?: {
    description: string;
    valueProposition: string;
  } | null;
  target_audience?: any;
  audience_analysis?: any;
  marketing_campaign?: any;
  generated_ads?: any[];
};

interface ProjectListProps {
  onStartAdWizard: (projectId?: string) => void;
}

const ProjectList = ({ onStartAdWizard }: ProjectListProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();

  const { data: projects, refetch, error, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          throw new Error("No authenticated session");
        }

        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Error fetching projects:", error);
          throw error;
        }

        // Transform the data to match our Project type
        return (data as DatabaseProject[]).map(project => ({
          ...project,
          business_idea: project.business_idea as Project['business_idea'],
          target_audience: project.target_audience,
          audience_analysis: project.audience_analysis,
          marketing_campaign: project.marketing_campaign,
          generated_ads: project.generated_ads as any[],
        }));
      } catch (error) {
        console.error("Error in queryFn:", error);
        throw error;
      }
    },
    retry: false,
  });

  const handleCreateProject = () => {
    setIsCreateOpen(true);
  };

  const handleProjectSuccess = (projectId: string) => {
    refetch();
    setIsCreateOpen(false);
  };

  const handleAdWizardNavigation = (projectId: string) => {
    setIsCreateOpen(false);
    onStartAdWizard(projectId);
  };

  const getRecentProjects = () => {
    if (!projects) return [];
    return projects
      .filter(project => {
        const status = validateProjectState(project);
        return status.state === 'ads_generated' || status.state === 'in_progress';
      })
      .slice(0, 3);
  };

  const getMostRecentInProgressProject = () => {
    if (!projects) return null;
    return projects.find(project => {
      const status = validateProjectState(project);
      return status.state === 'in_progress';
    });
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading projects. Please try again later.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>Loading projects...</p>
      </div>
    );
  }

  const recentProjects = getRecentProjects();
  const mostRecentInProgress = getMostRecentInProgressProject();

  return (
    <div className="space-y-8">
      {/* Recent Projects Section */}
      {recentProjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Recent Projects</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {recentProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onUpdate={refetch}
                onStartAdWizard={() => onStartAdWizard(project.id)}
                showProgress
                isRecent
              />
            ))}
          </div>
        </div>
      )}

      {/* All Projects Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight">All Projects</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {mostRecentInProgress ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Start Ad Campaign
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem onClick={() => onStartAdWizard(mostRecentInProgress.id)}>
                    <History className="mr-2 h-4 w-4" />
                    <span>Continue "{mostRecentInProgress.title}"</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStartAdWizard()}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Start New Campaign</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => onStartAdWizard()} 
                className="w-full sm:w-auto whitespace-nowrap"
              >
                <Plus className="mr-2 h-4 w-4" /> New Ad Campaign
              </Button>
            )}
            <Button 
              onClick={handleCreateProject} 
              variant="outline"
              className="w-full sm:w-auto whitespace-nowrap"
            >
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {projects?.slice(3).map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onUpdate={refetch}
              onStartAdWizard={() => onStartAdWizard(project.id)}
              showProgress
            />
          ))}
        </div>
      </div>

      <CreateProjectDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleProjectSuccess}
        onStartAdWizard={handleAdWizardNavigation}
      />
    </div>
  );
};

export default ProjectList;
