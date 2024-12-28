import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Save } from "lucide-react";
import { AdHook, AdImage } from "@/types/adWizard";
import AdFeedbackForm from "./AdFeedbackForm";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdVariantCardProps {
  image: AdImage;
  hook: AdHook;
  index: number;
  onCreateProject?: () => void;
}

const AdVariantCard = ({ image, hook, index, onCreateProject }: AdVariantCardProps) => {
  const [isSaving, setSaving] = useState(false);
  const [rating, setRating] = useState("");
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAndDownload = async () => {
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

      // If no project is selected, prompt to create one
      if (!onCreateProject) {
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

      // Convert rating to number before saving
      const numericRating = parseInt(rating, 10);
      
      const { error: feedbackError } = await supabase
        .from('ad_feedback')
        .insert({
          user_id: user.id,
          rating: numericRating,
          feedback,
          saved_images: [image]
        });

      if (feedbackError) throw feedbackError;

      // Download the image after successful save
      await downloadImage(image.url, `ad-variant-${index + 1}.jpg`);

      toast({
        title: "Success!",
        description: "Your feedback has been saved and image downloaded.",
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save feedback or download image.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video relative">
        <img
          src={image.url}
          alt={`Ad variant ${index + 1}`}
          className="object-cover w-full h-full"
        />
      </div>
      <CardContent className="p-4 space-y-4">
        <h3 className="font-medium text-lg">Variant {index + 1}</h3>
        <div className="space-y-2">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-1">Marketing Angle:</p>
            <p className="text-gray-800">{hook.description}</p>
          </div>
          <div className="bg-facebook/5 p-3 rounded-lg">
            <p className="text-sm font-medium text-facebook mb-1">Ad Copy:</p>
            <p className="text-gray-800 font-medium">{hook.text}</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <AdFeedbackForm
            rating={rating}
            feedback={feedback}
            onRatingChange={setRating}
            onFeedbackChange={setFeedback}
          />

          <Button
            onClick={handleSaveAndDownload}
            className="w-full bg-facebook hover:bg-facebook/90"
            disabled={isSaving}
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save & Download
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdVariantCard;