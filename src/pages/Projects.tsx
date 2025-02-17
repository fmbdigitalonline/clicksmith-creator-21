
import ProjectList from "@/components/projects/ProjectList";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Projects = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
        
      if (error) throw error;
      return data;
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

  return (
    <div className="container mx-auto px-4 py-4">
      {projectId ? (
        project ? (
          <div>
            <h1 className="text-2xl font-bold mb-4">{project.title}</h1>
            {/* Project details here */}
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
