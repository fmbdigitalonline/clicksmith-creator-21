import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ProjectForm, { ProjectFormData } from "./ProjectForm";
import ProjectActions from "./ProjectActions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (projectId: string) => void;
  onStartAdWizard?: (projectId?: string) => void;
  initialBusinessIdea?: string;
}

const generateProjectName = (businessIdea: string): string => {
  // Extract key terms from business idea
  const keywords = businessIdea.toLowerCase().split(' ');
  
  // Common creative prefixes
  const prefixes = [
    "Project",
    "Vision",
    "Venture",
    "Initiative",
    "Launch",
    "Innovation",
    "Blueprint",
  ];
  
  // Try to find meaningful words in the business idea
  const meaningfulWords = keywords.filter(word => 
    word.length > 3 && 
    !['the', 'and', 'for', 'that', 'with'].includes(word)
  );
  
  // Select a random prefix
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  // Get a key term from the business idea
  const keyTerm = meaningfulWords[0] || 'Venture';
  
  // Capitalize first letter of each word
  const capitalizedTerm = keyTerm.charAt(0).toUpperCase() + keyTerm.slice(1);
  
  return `${prefix} ${capitalizedTerm}`;
};

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
  const [includeWizardProgress, setIncludeWizardProgress] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
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

    setIsProcessing(true);

    try {
      const tags = values.tags
        ? values.tags.split(",").map((tag) => tag.trim())
        : [];

      const projectTitle = generateProjectName(values.businessIdea);

      let projectData: any = {
        title: projectTitle,
        description: values.description || null,
        tags,
        user_id: userId,
        status: "draft",
        business_idea: {
          description: values.businessIdea,
          valueProposition: `Enhanced version of: ${values.businessIdea}`,
        },
      };

      let hasWizardProgress = false;

      if (includeWizardProgress) {
        const { data: wizardProgress } = await supabase
          .from('wizard_progress')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (wizardProgress) {
          hasWizardProgress = true;
          projectData = {
            ...projectData,
            target_audience: wizardProgress.target_audience,
            audience_analysis: wizardProgress.audience_analysis,
            selected_hooks: wizardProgress.selected_hooks,
            ad_format: wizardProgress.ad_format,
            video_ad_preferences: wizardProgress.video_ad_preferences,
          };
        }
      }

      const { data, error } = await supabase
        .from("projects")
        .insert(projectData)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const newProjectId = data[0].id;
        setCreatedProjectId(newProjectId);

        // Close dialog first
        onOpenChange(false);

        if (hasWizardProgress && includeWizardProgress && onStartAdWizard) {
          toast({
            title: "Project created",
            description: "Starting Ad Wizard with your progress...",
          });
          // Navigate after dialog is closed
          onStartAdWizard(newProjectId);
        } else {
          setShowActions(true);
          onSuccess(newProjectId);
          toast({
            title: "Project created",
            description: "Your project has been created successfully.",
          });
        }
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error creating project",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateAds = () => {
    if (createdProjectId && onStartAdWizard) {
      // Close dialog first
      onOpenChange(false);
      // Then navigate
      onStartAdWizard(createdProjectId);
    }
  };

  const handleBackToProjects = () => {
    if (createdProjectId) {
      onSuccess(createdProjectId);
    }
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      setShowActions(false);
      setCreatedProjectId(null);
      setIncludeWizardProgress(true);
      setIsProcessing(false);
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
          <>
            <ProjectForm
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              initialBusinessIdea={initialBusinessIdea}
              disabled={isProcessing}
            />
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="includeProgress"
                checked={includeWizardProgress}
                onCheckedChange={(checked) => setIncludeWizardProgress(checked as boolean)}
                disabled={isProcessing}
              />
              <Label htmlFor="includeProgress" className={isProcessing ? "opacity-50" : ""}>
                Include wizard progress data in the project
              </Label>
            </div>
            {isProcessing && (
              <div className="flex items-center justify-center mt-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500 mr-2" />
                <span className="text-sm text-gray-500">Creating project...</span>
              </div>
            )}
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
