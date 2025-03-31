
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
import { useTranslation } from "react-i18next";

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
  searchQuery?: string;
  statusFilter?: string;
}

const ProjectList = ({ onStartAdWizard, searchQuery = "", statusFilter = "all" }: ProjectListProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation('projects');

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
    return projects.slice(0, 3);
  };

  const getMostRecentInProgressProject = () => {
    if (!projects) return null;
    return projects.find(project => 
      project.current_step > 1 && 
      (!project.generated_ads || project.generated_ads.length === 0)
    );
  };

  const filteredProjects = projects?.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "completed" && project.generated_ads?.length > 0) ||
      (statusFilter === "active" && project.current_step > 1 && !project.generated_ads?.length) ||
      (statusFilter === "not_started" && project.current_step === 1);

    return matchesSearch && matchesStatus;
  });

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{t('error_loading', 'Error loading projects. Please try again later.')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>{t('loading')}</p>
      </div>
    );
  }

  const recentProjects = getRecentProjects();
  const mostRecentInProgress = getMostRecentInProgressProject();

  return (
    <div className="space-y-8">
      {recentProjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">{t('recent.projects')}</h2>
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

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {mostRecentInProgress ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> {t('create')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem onClick={() => onStartAdWizard(mostRecentInProgress.id)}>
                    <History className="mr-2 h-4 w-4" />
                    <span>{t('continue_wizard', 'Continue')} "{mostRecentInProgress.title}"</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStartAdWizard()}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>{t('start_wizard', 'Start New Campaign')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => onStartAdWizard()} 
                className="w-full sm:w-auto whitespace-nowrap"
              >
                <Plus className="mr-2 h-4 w-4" /> {t('actions.generate_ads')}
              </Button>
            )}
            <Button 
              onClick={handleCreateProject} 
              variant="outline"
              className="w-full sm:w-auto whitespace-nowrap"
            >
              <Plus className="mr-2 h-4 w-4" /> {t('create')}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProjects?.map((project) => (
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
