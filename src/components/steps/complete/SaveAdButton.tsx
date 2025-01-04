import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { SavedAd, SavedAdJson } from "@/types/savedAd";
import { AdHook, AdImage } from "@/types/adWizard";
import { Json } from "@/integrations/supabase/types";

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

      // Only include project_id if it's a valid UUID (not "new")
      const isValidUUID = projectId && projectId !== "new";

      if (isValidUUID) {
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('generated_ads')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;

        const existingAds = ((project?.generated_ads as SavedAdJson[]) || []).map(ad => ({
          image: ad.image as AdImage,
          hook: ad.hook as AdHook,
          rating: ad.rating as number,
          feedback: ad.feedback as string,
          savedAt: ad.savedAt as string,
        }));

        const newAd: SavedAd = {
          image,
          hook,
          rating: parseInt(rating, 10),
          feedback,
          savedAt: new Date().toISOString()
        };

        const jsonAds: SavedAdJson[] = [...existingAds, newAd].map(ad => ({
          image: ad.image as Json,
          hook: ad.hook as Json,
          rating: ad.rating as Json,
          feedback: ad.feedback as Json,
          savedAt: ad.savedAt as Json,
        }));

        const { error: updateError } = await supabase
          .from('projects')
          .update({
            generated_ads: jsonAds
          })
          .eq('id', projectId);

        if (updateError) throw updateError;

        toast({
          title: "Success!",
          description: "Ad saved to project successfully.",
        });
      } else if (onCreateProject) {
        toast({
          title: "No Project Selected",
          description: "Please create a project to save your ad.",
          action: (
            <Button variant="outline" onClick={onCreateProject}>
              Create Project
            </Button>
          ),
        });
        return;
      }

      const { error: feedbackError } = await supabase
        .from('ad_feedback')
        .insert({
          user_id: user.id,
          project_id: isValidUUID ? projectId : null,
          rating: parseInt(rating, 10),
          feedback,
          saved_images: [image.url],
          primary_text: primaryText,
          headline: headline
        });

      if (feedbackError) throw feedbackError;

      onSaveSuccess();

      toast({
        title: "Success!",
        description: isValidUUID 
          ? "Your feedback has been saved and ad added to project."
          : "Your feedback has been saved.",
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
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