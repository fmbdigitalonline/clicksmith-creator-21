
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
  const [showDetails, setShowDetails] = useState(false);
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
    <>
      <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => setShowDetails(true)}>
        <ProjectCardHeader 
          title={project.title} 
          validationProgress={getValidationProgress()} 
        />
        <CardContent className="p-3 pt-2">
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
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
        </CardContent>
        <ProjectCardActions
          projectId={project.id}
          onEdit={() => setIsEditOpen(true)}
          onDelete={() => setIsDeleteOpen(true)}
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
