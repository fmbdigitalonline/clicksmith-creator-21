
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
    <CardFooter className="flex justify-end space-x-2">
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
        className="gap-2"
        onClick={handleCreateLandingPage}
      >
        <Layout className="h-4 w-4" />
        Create Landing Page
      </Button>
      <Button
        variant="default"
        className="gap-2"
        onClick={onStartAdWizard}
      >
        <PlayCircle className="h-4 w-4" />
        {hasCampaign ? "View Campaign" : "Create Campaign"}
      </Button>
    </CardFooter>
  );
};

export default ProjectCardActions;
