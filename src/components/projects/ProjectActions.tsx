
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Facebook, Plus, ArrowRight } from "lucide-react";

interface ProjectActionsProps {
  projectId: string;
  hasBusinessIdea?: boolean;
  onStartAdWizard?: () => void;
  onStartLandingPageWizard?: () => void;
}

const ProjectActions = ({
  projectId,
  hasBusinessIdea = false,
  onStartAdWizard,
  onStartLandingPageWizard,
}: ProjectActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {hasBusinessIdea ? (
        <>
          <Button
            onClick={onStartAdWizard}
            className="sm:w-auto w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Ad Campaign
          </Button>
          <Button
            onClick={() => navigate(`/facebook-ads/${projectId}`)}
            className="sm:w-auto w-full bg-facebook hover:bg-facebook/90 text-white"
          >
            <Facebook className="mr-2 h-4 w-4" />
            Facebook Ads
          </Button>
          <Button
            onClick={onStartLandingPageWizard}
            variant="outline"
            className="sm:w-auto w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Landing Page
          </Button>
        </>
      ) : (
        <Button
          onClick={onStartAdWizard}
          className="sm:w-auto w-full"
        >
          Start Idea Wizard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ProjectActions;
