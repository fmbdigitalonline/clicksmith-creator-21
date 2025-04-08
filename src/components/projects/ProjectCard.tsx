
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { ArrowRight, Play, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

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
  onStartAdWizard: () => void;
  showProgress?: boolean;
  isRecent?: boolean;
}

const ProjectCard = ({ project, onUpdate, onStartAdWizard, showProgress = false, isRecent = false }: ProjectCardProps) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation('projects');

  const handleDelete = async () => {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    if (error) {
      toast({
        title: t("edit.error", "Error deleting project"),
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t("edit.success"),
      description: t("edit.success_description"),
    });
    onUpdate();
  };

  const getValidationProgress = () => {
    let progress = 0;
    if (project.business_idea) progress += 25;
    if (project.target_audience) progress += 25;
    if (project.audience_analysis) progress += 25;
    if (project.marketing_campaign) progress += 25;
    return progress;
  };

  const getStepStatusIcon = () => {
    if (project.generated_ads?.length > 0) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (project.current_step > 1) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    return <Play className="h-4 w-4 text-blue-500" />;
  };

  const getStatusText = () => {
    if (project.generated_ads?.length > 0) {
      return t("table.complete");
    }
    if (project.current_step > 1) {
      return t("table.step", { step: project.current_step, total: 4 });
    }
    return t("table.not_started");
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
                  {t("table.last_updated")}: {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                </span>
              </div>
              <Progress value={progressValue} className="h-1" />
            </div>
          )}
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.business_idea?.description || project.description || t("form.notes_placeholder")}
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
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/projects/${project.id}`);
            }}
            className="w-full mt-2 gap-2"
          >
            {t("actions.view")} <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>

        <ProjectCardActions
          projectId={project.id}
          onEdit={() => setIsEditOpen(true)}
          onDelete={() => setIsDeleteOpen(true)}
          onStartAdWizard={onStartAdWizard}
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
            <AlertDialogTitle>{t("actions.delete")}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t("validation.incomplete_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("form.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("actions.delete")}</AlertDialogAction>
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
