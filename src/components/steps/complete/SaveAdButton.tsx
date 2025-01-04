import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SavedAd, SavedAdJson } from "@/types/savedAd";
import { AdHook, AdImage } from "@/types/adWizard";
import { Json } from "@/integrations/supabase/types";
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
    console.log('Starting save process...', { image, hook, rating, feedback });
    
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

      console.log('User authenticated:', user.id);

      // Only include project_id if it's a valid UUID
      const isValidUUID = projectId && projectId !== "new" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);
      const validProjectId = isValidUUID ? projectId : null;

      console.log('Project ID validation:', { projectId, isValidUUID, validProjectId });

      if (validProjectId) {
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('generated_ads')
          .eq('id', validProjectId)
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
          .eq('id', validProjectId);

        if (updateError) throw updateError;

        console.log('Project updated successfully');

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

      // Save feedback with proper data transformation
      const feedbackData = {
        id: uuidv4(),
        user_id: user.id,
        project_id: validProjectId,
        rating: parseInt(rating, 10),
        feedback,
        saved_images: [image.url],
        primary_text: primaryText || null,
        headline: headline || null,
        created_at: new Date().toISOString()
      };

      console.log('Saving feedback data:', feedbackData);

      const { error: feedbackError } = await supabase
        .from('ad_feedback')
        .insert(feedbackData);

      if (feedbackError) {
        console.error('Error saving feedback:', feedbackError);
        throw feedbackError;
      }

      console.log('Feedback saved successfully');
      onSaveSuccess();

      toast({
        title: "Success!",
        description: validProjectId 
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