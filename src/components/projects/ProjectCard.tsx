
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import EditProjectDialog from "./EditProjectDialog";
import ProjectCardHeader from "./card/ProjectCardHeader";
import ProjectCardActions from "./card/ProjectCardActions";
import ProjectProgressDetails from "./ProjectProgressDetails";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Play, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { validateProjectState, getProjectStateText } from "@/utils/projectValidation";

interface Project {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  status: string;
  current_step: number;
  updated_at: string;
  business_idea?: {
    description: string;
    valueProposition: string;
  };
  target_audience?: any;
  audience_analysis?: any;
  marketing_campaign?: any;
  generated_ads?: any[];
}

interface ProjectCardProps {
  project: Project;
  onUpdate: () => void;
  onStartAdWizard: (projectId?: string, view?: string) => void;
  showProgress?: boolean;
  isRecent?: boolean;
}

const ProjectCard = ({ project, onUpdate, onStartAdWizard, showProgress = false, isRecent = false }: ProjectCardProps) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const projectStatus = validateProjectState(project);

  const handleDelete = async () => {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    if (error) {
      toast({
        title: "Error deleting project",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Project deleted",
      description: "Your project has been deleted successfully.",
    });
    onUpdate();
  };

  const handleAdNavigation = () => {
    if (projectStatus.state === 'needs_regeneration') {
      toast({
        title: "Regeneration needed",
        description: "Your ads need to be regenerated. Starting from the last completed step.",
        duration: 5000,
      });
    }
    onStartAdWizard(
      project.id, 
      projectStatus.hasValidAds ? 'gallery' : undefined
    );
  };

  const getValidationProgress = () => {
    return (projectStatus.completedSteps / 4) * 100;
  };

  const getStepStatusIcon = () => {
    switch (projectStatus.state) {
      case 'ads_generated':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'needs_regeneration':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Play className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusText = () => {
    return getProjectStateText(projectStatus.state);
  };

  const getButtonText = () => {
    switch (projectStatus.state) {
      case 'ads_generated':
        return "View Generated Ads";
      case 'needs_regeneration':
        return "Regenerate Ads";
      case 'in_progress':
        return "Continue";
      default:
        return "Start";
    }
  };

  const progressValue = getValidationProgress();

  return (
    <>
      <Card className={`
        transition-all hover:shadow-md relative overflow-hidden
        ${isRecent ? 'border-primary/20' : ''}
      `}>
        <ProjectCardHeader 
          title={project.title} 
          validationProgress={progressValue}
        />
        <CardContent className="p-4 space-y-3">
          {showProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {getStepStatusIcon()}
                  <span className="text-muted-foreground">{getStatusText()}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                </span>
              </div>
              <Progress value={progressValue} className="h-1" />
            </div>
          )}
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.business_idea?.description || project.description || "No description provided"}
          </p>

          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <Button 
            onClick={handleAdNavigation}
            className="w-full mt-2 gap-2"
            variant={projectStatus.hasValidAds ? "secondary" : "default"}
          >
            {getButtonText()}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>

        <ProjectCardActions
          projectId={project.id}
          onEdit={() => setIsEditOpen(true)}
          onDelete={() => setIsDeleteOpen(true)}
          onStartAdWizard={handleAdNavigation}
          hasCampaign={!!project.marketing_campaign}
          hasBusinessIdea={!!project.business_idea}
          hasTargetAudience={!!project.target_audience}
          hasAudienceAnalysis={!!project.audience_analysis}
        />
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">{project.title}</h2>
            <ProjectProgressDetails
              businessIdea={project.business_idea}
              targetAudience={project.target_audience}
              audienceAnalysis={project.audience_analysis}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              validation project and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditProjectDialog
        project={project}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={() => {
          onUpdate();
          setIsEditOpen(false);
        }}
      />
    </>
  );
};

export default ProjectCard;
