
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ProjectForm, { ProjectFormData } from "./ProjectForm";
import ProjectActions from "./ProjectActions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  const [showActions, setShowActions] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [includeWizardProgress, setIncludeWizardProgress] = useState(true);
  
  const handleSubmit = async (values: ProjectFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error creating project",
          description: "You must be logged in to create a project",
          variant: "destructive",
        });
        return;
      }

      // Get current wizard progress if checkbox is checked
      let wizardProgress = null;
      if (includeWizardProgress) {
        const { data: progressData } = await supabase
          .from('wizard_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        wizardProgress = progressData;
      }

      const tags = values.tags
        ? values.tags.split(",").map((tag) => tag.trim())
        : [];

      const { data, error } = await supabase
        .from("projects")
        .insert({
          title: values.title,
          description: values.description || null,
          tags,
          user_id: user.id,
          status: "draft",
          business_idea: wizardProgress?.business_idea || {
            description: values.businessIdea,
            valueProposition: `Enhanced version of: ${values.businessIdea}`,
          },
          target_audience: wizardProgress?.target_audience || null,
          audience_analysis: wizardProgress?.audience_analysis || null,
          selected_hooks: wizardProgress?.selected_hooks || null,
          generated_ads: wizardProgress?.generated_ads || [],
          ad_format: wizardProgress?.ad_format || null,
          video_ad_preferences: wizardProgress?.video_ad_preferences || null
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setCreatedProjectId(data.id);
        setShowActions(true);
        toast({
          title: "Project created",
          description: "Your project has been created successfully.",
        });
        onSuccess(data.id);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error creating project",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
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
          <>
            <ProjectForm
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              initialBusinessIdea={initialBusinessIdea}
            />
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="includeProgress"
                checked={includeWizardProgress}
                onCheckedChange={(checked) => setIncludeWizardProgress(checked as boolean)}
              />
              <Label htmlFor="includeProgress">
                Include wizard progress data in the project
              </Label>
            </div>
          </>
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
