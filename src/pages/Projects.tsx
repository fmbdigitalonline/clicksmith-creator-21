
import ProjectList from "@/components/projects/ProjectList";
import { useNavigate } from "react-router-dom";

const Projects = () => {
  const navigate = useNavigate();

  const handleStartAdWizard = (projectId?: string) => {
    if (projectId) {
      navigate(`/ad-wizard/${projectId}`);
    } else {
      navigate("/ad-wizard/new");
    }
  };

  return (
    <div className="container mx-auto px-4 py-4">
      <ProjectList onStartAdWizard={handleStartAdWizard} />
    </div>
  );
};

export default Projects;
