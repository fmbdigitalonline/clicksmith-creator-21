
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectCardActionsProps {
  projectId: string;
  onDelete?: () => void;
}

const ProjectCardActions = ({ projectId, onDelete }: ProjectCardActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={() => navigate(`/ad-wizard/${projectId}`)}
        className="w-full"
      >
        <Wand2 className="mr-2 h-4 w-4" />
        Generate Ads
      </Button>
    </div>
  );
};

export default ProjectCardActions;
