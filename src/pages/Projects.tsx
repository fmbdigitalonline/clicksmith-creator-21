
import ProjectList from "@/components/projects/ProjectList";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ProjectProgressDetails from "@/components/projects/ProjectProgressDetails";
import { BusinessIdea, TargetAudience, AudienceAnalysis } from "@/types/adWizard";

interface Project {
  id: string;
  title: string;
  business_idea: BusinessIdea | null;
  target_audience: TargetAudience | null;
  audience_analysis: AudienceAnalysis | null;
  marketing_campaign: any | null;
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
      return data as Project | null;
    },
    enabled: !!projectId
  });

  const handleStartAdWizard = (projectId?: string) => {
    if (projectId) {
      navigate(`/ad-wizard/${projectId}`);
    } else {
      navigate("/ad-wizard/new");
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
                  onClick={() => handleStartAdWizard(project.id)}
                  className="w-full sm:w-auto"
                >
                  Continue Ad Creation
                </Button>
                {project.marketing_campaign && (
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/projects/${project.id}/landing-page`)}
                    className="w-full sm:w-auto"
                  >
                    View Landing Page
                  </Button>
                )}
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
