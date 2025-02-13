
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EditProjectDialog from "./EditProjectDialog";
import ProjectCardHeader from "./card/ProjectCardHeader";
import ProjectProgressDetails from "./card/ProjectProgressDetails";
import ProjectCardActions from "./card/ProjectCardActions";

interface Project {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  status: string;
  business_idea?: {
    description: string;
    valueProposition: string;
  };
  target_audience?: any;
  audience_analysis?: any;
  marketing_campaign?: any;
}

interface ProjectCardProps {
  project: Project;
  onUpdate: () => void;
  onStartAdWizard: () => void;
}

const ProjectCard = ({ project, onUpdate, onStartAdWizard }: ProjectCardProps) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const getValidationProgress = () => {
    let progress = 0;
    if (project.business_idea) progress += 25;
    if (project.target_audience) progress += 25;
    if (project.audience_analysis) progress += 25;
    if (project.marketing_campaign) progress += 25;
    return progress;
  };

  return (
    <Card className="cursor-pointer transition-all hover:shadow-md flex flex-col">
      <ProjectCardHeader 
        title={project.title} 
        validationProgress={getValidationProgress()} 
      />
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {project.business_idea?.description || project.description || "No description provided"}
        </p>
        {project.tags && project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
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

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{project.title}</DialogTitle>
          </DialogHeader>
          <ProjectProgressDetails
            businessIdea={project.business_idea}
            targetAudience={project.target_audience}
            audienceAnalysis={project.audience_analysis}
          />
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
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="w-full sm:w-auto"
            >
              Delete
            </AlertDialogAction>
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
    </Card>
  );
};

export default ProjectCard;
