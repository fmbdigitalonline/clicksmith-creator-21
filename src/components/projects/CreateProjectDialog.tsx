import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ProjectForm, { ProjectFormData } from "./ProjectForm";
import ProjectActions from "./ProjectActions";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (projectId: string) => void;
  onStartAdWizard?: (projectId?: string) => void;
  initialBusinessIdea?: string;
}

const CreateProjectDialog = ({
  open,
  onOpenChange,
  onSuccess,
  onStartAdWizard,
  initialBusinessIdea,
}: CreateProjectDialogProps) => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  const handleSubmit = async (values: ProjectFormData) => {
    if (!userId) {
      toast({
        title: "Error creating project",
        description: "You must be logged in to create a project",
        variant: "destructive",
      });
      return;
    }

    const tags = values.tags
      ? values.tags.split(",").map((tag) => tag.trim())
      : [];

    const { data, error } = await supabase.from("projects").insert({
      title: values.title,
      description: values.description || null,
      tags,
      user_id: userId,
      status: "draft",
      business_idea: {
        description: values.businessIdea,
        valueProposition: `Enhanced version of: ${values.businessIdea}`,
      },
    }).select();

    if (error) {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data && data[0]) {
      setCreatedProjectId(data[0].id);
      setShowActions(true);
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });
      onSuccess(data[0].id);
    }
  };

  const handleGenerateAds = () => {
    if (createdProjectId && onStartAdWizard) {
      onStartAdWizard(createdProjectId);
      onOpenChange(false);
    }
  };

  const handleBackToProjects = () => {
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      setShowActions(false);
      setCreatedProjectId(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {showActions ? "What's next?" : "Create New Validation Project"}
          </DialogTitle>
          <DialogDescription>
            {showActions 
              ? "Choose your next action for the project"
              : "Start validating your business idea through market testing"
            }
          </DialogDescription>
        </DialogHeader>
        {!showActions ? (
          <ProjectForm
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            initialBusinessIdea={initialBusinessIdea}
          />
        ) : (
          <ProjectActions
            onGenerateAds={handleGenerateAds}
            onBackToProjects={handleBackToProjects}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;