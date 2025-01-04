import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdHook, AdImage } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

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
    if (!rating) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be logged in to save feedback');
      }

      // Check if projectId is "new" and handle accordingly
      if (projectId === "new" && onCreateProject) {
        onCreateProject();
        return;
      }

      // Validate UUID format if projectId exists and isn't "new"
      const isValidUUID = projectId && 
                         /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);

      const feedbackData = {
        id: uuidv4(),
        user_id: user.id,
        ...(isValidUUID && { project_id: projectId }),
        rating: parseInt(rating, 10),
        feedback,
        saved_images: [image.url],
        primary_text: primaryText || null,
        headline: headline || null,
        created_at: new Date().toISOString()
      };

      const { error: feedbackError } = await supabase
        .from('ad_feedback')
        .insert(feedbackData);

      if (feedbackError) {
        console.error('Error saving feedback:', feedbackError);
        throw feedbackError;
      }

      onSaveSuccess();
      toast({
        title: "Success!",
        description: isValidUUID 
          ? "Your feedback has been saved and ad added to project."
          : "Your feedback has been saved.",
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
      
      // Special handling for "new" project case
      if (projectId === "new") {
        toast({
          title: "Create Project First",
          description: "Please create a project to save your ad.",
          action: onCreateProject ? (
            <Button variant="outline" onClick={onCreateProject}>
              Create Project
            </Button>
          ) : undefined,
        });
        return;
      }

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save feedback.",
        variant: "destructive",
      });
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