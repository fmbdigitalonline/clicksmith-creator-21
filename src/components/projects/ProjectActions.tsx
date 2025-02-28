
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Facebook, Plus, ArrowRight } from "lucide-react";

interface ProjectActionsProps {
  projectId: string;
  hasBusinessIdea?: boolean;
  onStartAdWizard?: () => void;
  onStartLandingPageWizard?: () => void;
  // Add these new properties for CreateProjectDialog compatibility
  onGenerateAds?: () => void;
  onBackToProjects?: () => void;
}

const ProjectActions = ({
  projectId,
  hasBusinessIdea = false,
  onStartAdWizard,
  onStartLandingPageWizard,
  onGenerateAds,
  onBackToProjects
}: ProjectActionsProps) => {
  const navigate = useNavigate();

  // If we have the new handler props, we're being used from CreateProjectDialog
  if (onGenerateAds && onBackToProjects) {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onGenerateAds}
          className="sm:w-auto w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Generate Ad Campaign
        </Button>
        <Button
          onClick={onBackToProjects}
          variant="outline"
          className="sm:w-auto w-full"
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  // Original behavior
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
