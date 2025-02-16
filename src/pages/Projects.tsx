
import ProjectList from "@/components/projects/ProjectList";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle, Layout } from "lucide-react";

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Landing Pages</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button 
            onClick={() => navigate('/projects/new/landing-page')} 
            className="w-full sm:w-auto whitespace-nowrap"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Create Landing Page
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/saved-landing-pages')}
            className="w-full sm:w-auto whitespace-nowrap"
          >
            <Layout className="mr-2 h-4 w-4" /> View Saved Pages
          </Button>
        </div>
      </div>
      <ProjectList onStartAdWizard={handleStartAdWizard} />
    </div>
  );
};

export default Projects;
