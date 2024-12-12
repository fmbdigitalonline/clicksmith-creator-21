import ProjectList from "@/components/projects/ProjectList";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const handleStartAdWizard = (projectId?: string) => {
    if (projectId) {
      navigate(`/ad-wizard/${projectId}`);
    } else {
      navigate("/ad-wizard/new");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Business Idea Validator</h1>
          <p className="text-lg text-muted-foreground">
            Validate your business concept through targeted market testing and AI-powered Facebook ad campaigns
          </p>
          <Button 
            size="lg" 
            onClick={() => handleStartAdWizard()}
            className="mt-4 gap-2"
          >
            <Wand2 className="h-5 w-5" />
            Start Validation Wizard
          </Button>
        </div>
        <ProjectList onStartAdWizard={handleStartAdWizard} />
      </div>
    </div>
  );
};

export default Index;