
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
  onSaveSuccess: () => void;
}

export const SaveAdButton = ({
  image,
  hook,
  primaryText,
  headline,
  rating,
  feedback,
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

      // Check if this image is already saved for this user+project
      const { data: existingAds, error: checkError } = await supabase
        .from('ad_feedback')
        .select('id')
        .eq('user_id', user.id)
        .eq('project_id', window.location.pathname.split('/').pop())
        .eq('imageurl', image.url);
      
      if (checkError) {
        console.error('Error checking existing ads:', checkError);
      }
      
      // If the ad is already saved, don't save it again
      if (existingAds && existingAds.length > 0) {
        toast({
          title: "Ad Already Saved",
          description: "This ad has already been saved to your gallery.",
        });
        setSaving(false);
        return;
      }

      const feedbackData = {
        id: uuidv4(),
        user_id: user.id,
        project_id: window.location.pathname.split('/').pop(),
        rating: parseInt(rating, 10),
        feedback,
        primary_text: primaryText || hook.text || null,
        headline: headline || hook.description || null,
        imageurl: image.url,
        platform: 'facebook',
        size: {
          width: 1200,
          height: 628,
          label: "Landscape (1.91:1)"
        }
      };

      console.log('Saving feedback data:', feedbackData);

      const { error: feedbackError } = await supabase
        .from('ad_feedback')
        .insert(feedbackData);

      if (feedbackError) {
        throw feedbackError;
      }

      onSaveSuccess();
      toast({
        title: "Success!",
        description: "Your ad has been saved to your gallery.",
      });
    } catch (error) {
      console.error('Error saving ad:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save ad.",
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
