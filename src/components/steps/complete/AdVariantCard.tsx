
import { Card, CardContent } from "@/components/ui/card";
import { AdHook, AdImage } from "@/types/adWizard";
import AdFeedbackForm from "./AdFeedbackForm";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { SaveAdButton } from "./SaveAdButton";
import { Button } from "@/components/ui/button";
import { Wand, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdVariantCardProps {
  image: AdImage;
  hook: AdHook;
  index: number;
  onCreateProject?: () => void;
}

const AdVariantCard = ({ image, hook, index, onCreateProject }: AdVariantCardProps) => {
  const [rating, setRating] = useState("");
  const [feedback, setFeedback] = useState("");
  const { projectId } = useParams();
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState(hook.text || "Professional marketing image for advertisement");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ad-variant-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleRegenerateImage = async (prompt: string) => {
    setIsRegenerating(true);
    try {
      // Call the edge function to regenerate the image
      const { data, error } = await supabase.functions.invoke('generate-images', {
        body: { 
          prompt,
          // We don't have an adId in this context, so we'll generate a temporary id
          adId: `temp_${Date.now()}`
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Image regeneration started",
        description: "Your new image is being generated. This may take a moment."
      });
      
      // Since we don't have a stored ad yet, we'll need to poll for the result
      // or update the UI with the generated image URL when it's available
      if (data && data.imageUrl) {
        // Update the image URL in our local state/UI
        // Note: This will require modifying how images are stored and managed in the parent component
        // For now, we'll just show a toast notification
        toast({
          title: "Image regenerated",
          description: "Your new image has been generated successfully."
        });
      }
    } catch (error) {
      console.error('Error regenerating image:', error);
      toast({
        title: "Regeneration failed",
        description: "Could not regenerate the image. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
      setIsRegenerateDialogOpen(false);
    }
  };

  const handleSubmitRegeneration = () => {
    handleRegenerateImage(regeneratePrompt);
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video relative">
        <div
          className="relative w-full h-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img
            src={image.url}
            alt={`Ad variant ${index + 1}`}
            className="object-cover w-full h-full"
          />
          {isHovered && (
            <Button 
              variant="secondary"
              size="icon"
              className="absolute bottom-3 right-3 bg-white/90 hover:bg-white shadow-md"
              onClick={() => setIsRegenerateDialogOpen(true)}
              title="Regenerate image"
            >
              <Wand className="h-4 w-4" />
            </Button>
          )}
        </div>
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

          <SaveAdButton
            image={image}
            hook={hook}
            primaryText={hook.text}
            headline={hook.description}
            rating={rating}
            feedback={feedback}
            projectId={projectId}
            onCreateProject={onCreateProject}
            onSaveSuccess={handleDownload}
          />
        </div>
      </CardContent>

      {/* Regenerate Image Dialog */}
      <Dialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Regenerate Image</DialogTitle>
            <DialogDescription>
              Enter specific instructions to customize your new ad image.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="Describe what you'd like to see in this image..."
              className="min-h-[120px]"
              value={regeneratePrompt}
              onChange={(e) => setRegeneratePrompt(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRegenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRegeneration} disabled={isRegenerating}>
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdVariantCard;
