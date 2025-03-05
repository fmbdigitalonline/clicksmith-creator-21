
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket, Facebook } from "lucide-react";

interface ProjectActionsProps {
  onGenerateAds: () => void;
  onBackToProjects: () => void;
  onGenerateCampaign?: () => void;
  campaignEnabled?: boolean;
}

const ProjectActions = ({ 
  onGenerateAds, 
  onBackToProjects,
  onGenerateCampaign,
  campaignEnabled = false
}: ProjectActionsProps) => {
  return (
    <div className="space-y-4">
      <p className="text-center text-muted-foreground">
        What would you like to do next?
      </p>
      <div className="flex flex-col gap-3">
        <Button
          onClick={onGenerateAds}
          className="w-full"
          size="lg"
        >
          <Rocket className="mr-2" />
          Generate Ads
        </Button>
        
        {campaignEnabled && onGenerateCampaign && (
          <Button
            onClick={onGenerateCampaign}
            className="w-full"
            size="lg"
            variant="facebook"
          >
            <Facebook className="mr-2" />
            Publish to Facebook
          </Button>
        )}
        
        <Button
          onClick={onBackToProjects}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <ArrowLeft className="mr-2" />
          Back to Projects
        </Button>
      </div>
    </div>
  );
};

export default ProjectActions;
