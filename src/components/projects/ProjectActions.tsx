import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket } from "lucide-react";

interface ProjectActionsProps {
  onGenerateAds: () => void;
  onBackToProjects: () => void;
}

const ProjectActions = ({ onGenerateAds, onBackToProjects }: ProjectActionsProps) => {
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