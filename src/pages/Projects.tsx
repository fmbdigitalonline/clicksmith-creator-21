import ProjectList from "@/components/projects/ProjectList";
import { useNavigate } from "react-router-dom";

const Projects = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6">
      <ProjectList onStartAdWizard={(projectId?: string) => {
        if (projectId) {
          navigate(`/ad-wizard/${projectId}`);
        } else {
          navigate("/ad-wizard/new");
        }
      }} />
    </div>
  );
};

export default Projects;