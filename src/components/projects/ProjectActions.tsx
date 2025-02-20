
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface ProjectActionsProps {
  onStartAdWizard: () => void;
  disabled?: boolean;
}

const ProjectActions = ({ onStartAdWizard, disabled }: ProjectActionsProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={onStartAdWizard}
        disabled={disabled}
        className="w-full"
      >
        <Wand2 className="mr-2 h-4 w-4" />
        Generate Ads
      </Button>
    </div>
  );
};

export default ProjectActions;
