
import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, PlayCircle, Layout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ProjectCardActionsProps {
  projectId: string;
  onEdit: () => void;
  onDelete: () => void;
  onStartAdWizard: () => void;
  hasCampaign: boolean;
  hasBusinessIdea?: boolean;
  hasTargetAudience?: boolean;
  hasAudienceAnalysis?: boolean;
}

const ProjectCardActions = ({ 
  projectId,
  onEdit, 
  onDelete, 
  onStartAdWizard,
  hasCampaign,
  hasBusinessIdea,
  hasTargetAudience,
  hasAudienceAnalysis
}: ProjectCardActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateLandingPage = () => {
    if (!hasBusinessIdea || !hasTargetAudience || !hasAudienceAnalysis) {
      toast({
        title: "Missing information",
        description: "Please complete the business idea, target audience, and market analysis steps before creating a landing page.",
        variant: "destructive",
      });
      return;
    }
    
    navigate(`/projects/${projectId}/landing-page`);
  };

  return (
    <CardFooter className="flex flex-wrap gap-2 justify-end">
      <Button
        variant="outline"
        size="icon"
        onClick={onEdit}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        className="flex items-center gap-2 whitespace-nowrap"
        onClick={handleCreateLandingPage}
      >
        <Layout className="h-4 w-4" />
        Create Landing Page
      </Button>
      <Button
        variant="default"
        className="flex items-center gap-2 whitespace-nowrap"
        onClick={onStartAdWizard}
      >
        <PlayCircle className="h-4 w-4" />
        {hasCampaign ? "View Campaign" : "Create Campaign"}
      </Button>
    </CardFooter>
  );
};

export default ProjectCardActions;
