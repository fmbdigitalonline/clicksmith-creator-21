
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdHook, AdImage } from "@/types/adWizard";
import { saveAd } from "@/utils/adSaving";

interface SaveAdButtonProps {
  image: AdImage;
  hook: AdHook;
  primaryText?: string;
  headline?: string;
  rating: string;
  feedback: string;
  projectId?: string;
  onCreateProject?: () => void;
  onSaveSuccess: () => void;
}

export const SaveAdButton = ({
  image,
  hook,
  primaryText,
  headline,
  rating,
  feedback,
  projectId,
  onCreateProject,
  onSaveSuccess,
}: SaveAdButtonProps) => {
  const [isSaving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!projectId) {
        if (onCreateProject) {
          toast({
            title: "Project Required",
            description: "Please create a project to save your ad.",
            action: (
              <Button variant="outline" onClick={onCreateProject}>
                Create Project
              </Button>
            ),
          });
        } else {
          toast({
            title: "Error",
            description: "No project selected to save the ad.",
            variant: "destructive",
          });
        }
        setSaving(false);
        return;
      }
      
      const adData = {
        image,
        hook,
        rating,
        feedback,
        primaryText,
        headline
      };
      
      const result = await saveAd(projectId, adData);

      if (result.success) {
        onSaveSuccess();
        toast({
          title: "Success!",
          description: result.message,
        });
      } else {
        if (result.shouldCreateProject && onCreateProject) {
          toast({
            title: result.message || "Project Required",
            description: "Please create a project to save your ad.",
            action: (
              <Button variant="outline" onClick={onCreateProject}>
                Create Project
              </Button>
            ),
          });
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to save ad.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      onClick={handleSave}
      className="w-full bg-facebook hover:bg-facebook/90"
      disabled={isSaving}
    >
      {isSaving ? (
        "Saving..."
      ) : (
        <>
          <Save className="w-4 h-4 mr-2" />
          Save Ad
        </>
      )}
    </Button>
  );
};
