
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProjectCard from "./ProjectCard";
import CreateProjectDialog from "./CreateProjectDialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Project = Database['public']['Tables']['projects']['Row'] & {
  business_idea: {
    description: string;
    valueProposition: string;
  } | null;
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
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching projects:", error);
          throw error;
        }

        return data as Project[];
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

  // Separate handler for ad wizard navigation
  const handleAdWizardNavigation = (projectId: string) => {
    setIsCreateOpen(false); // Close dialog first
    onStartAdWizard(projectId); // Navigate after dialog is closed
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Your Projects</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button 
            onClick={() => onStartAdWizard()} 
            className="w-full sm:w-auto whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" /> New Ad Campaign
          </Button>
          <Button 
            onClick={handleCreateProject} 
            variant="outline"
            className="w-full sm:w-auto whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {projects?.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            onUpdate={refetch}
            onStartAdWizard={() => onStartAdWizard(project.id)} 
          />
        ))}
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
