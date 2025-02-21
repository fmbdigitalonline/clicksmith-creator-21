import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ProjectForm, { ProjectFormData } from "./ProjectForm";
import ProjectActions from "./ProjectActions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (projectId: string, shouldNavigate: boolean) => void;
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
  const [createMode, setCreateMode] = useState<'save' | 'continue'>('save');
  
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

    if (includeWizardProgress) {
      const { data: wizardProgress } = await supabase
        .from('wizard_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (wizardProgress) {
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

    if (error) {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data && data[0]) {
      const projectId = data[0].id;
      setCreatedProjectId(projectId);
      
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });

      // Call onSuccess with the navigation flag based on creation mode
      onSuccess(projectId, createMode === 'continue');
      
      // Only show actions if we're not continuing to ad wizard
      if (createMode !== 'continue') {
        setShowActions(true);
      }
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
      setIncludeWizardProgress(true);
      setCreateMode('save');
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
          <div className="space-y-6">
            <ProjectForm
              onSubmit={(values) => {
                setCreateMode('save');
                handleSubmit(values);
              }}
              onCancel={() => onOpenChange(false)}
              initialBusinessIdea={initialBusinessIdea}
              additionalActions={
                <Button 
                  type="button"
                  onClick={() => {
                    setCreateMode('continue');
                    handleSubmit({
                      title: "",
                      description: "",
                      tags: "",
                      businessIdea: initialBusinessIdea || "",
                    });
                  }}
                  className="w-full"
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  Create & Continue in Ad Wizard
                </Button>
              }
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeProgress"
                checked={includeWizardProgress}
                onCheckedChange={(checked) => setIncludeWizardProgress(checked as boolean)}
              />
              <Label htmlFor="includeProgress">
                Include wizard progress data in the project
              </Label>
            </div>
          </div>
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
