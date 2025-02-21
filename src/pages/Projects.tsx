import ProjectList from "@/components/projects/ProjectList";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Layout } from "lucide-react";
import ProjectProgressDetails from "@/components/projects/ProjectProgressDetails";
import { BusinessIdea, TargetAudience, AudienceAnalysis } from "@/types/adWizard";

interface Project {
  id: string;
  title: string;
  business_idea: BusinessIdea | null;
  target_audience: TargetAudience | null;
  audience_analysis: AudienceAnalysis | null;
  marketing_campaign: any | null;
  generated_ads?: any[];
}

const Projects = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const { data: project, isError } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();
        
      if (error) throw error;
      
      // First cast to unknown, then to Project
      const typedData = data as unknown as Project;
      return typedData;
    },
    enabled: !!projectId
  });

  const handleStartAdWizard = (projectId?: string, view?: string) => {
    if (projectId) {
      // Use replace to prevent back button issues
      navigate(view ? `/ad-wizard/${projectId}/${view}` : `/ad-wizard/${projectId}`, { replace: true });
    } else {
      navigate("/ad-wizard/new", { replace: true });
    }
  };

  const handleCreateLandingPage = () => {
    if (project?.id) {
      navigate(`/projects/${project.id}/landing-page`);
    }
  };

  if (projectId && !project) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col items-center justify-center py-12">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate("/projects")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      {projectId ? (
        project ? (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button onClick={() => navigate("/projects")} variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">{project.title}</h1>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => handleStartAdWizard(project.id, project.generated_ads?.length ? 'gallery' : undefined)}
                  className="w-full sm:w-auto"
                >
                  {project.generated_ads?.length ? 'View Generated Ads' : 'Continue Ad Creation'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleCreateLandingPage}
                  className="w-full sm:w-auto"
                >
                  <Layout className="w-4 h-4 mr-2" />
                  Create Landing Page
                </Button>
              </div>
              <ProjectProgressDetails
                businessIdea={project.business_idea || undefined}
                targetAudience={project.target_audience || undefined}
                audienceAnalysis={project.audience_analysis || undefined}
              />
            </div>
          </div>
        ) : (
          <div>Loading project...</div>
        )
      ) : (
        <ProjectList onStartAdWizard={handleStartAdWizard} />
      )}
    </div>
  );
};

export default Projects;
