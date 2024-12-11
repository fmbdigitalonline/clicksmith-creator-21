import { Card, CardContent } from "@/components/ui/card";
import { AdHook, AdImage, BusinessIdea } from "@/types/adWizard";
import { Button } from "@/components/ui/button";
import { Download, Star, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdVariantGridProps {
  adImages: AdImage[];
  adHooks: AdHook[];
  businessIdea: BusinessIdea;
}

interface AdVariantFeedback {
  rating: string;
  feedback: string;
}

const AdVariantGrid = ({ adImages, adHooks, businessIdea }: AdVariantGridProps) => {
  const [feedbacks, setFeedbacks] = useState<{ [key: number]: AdVariantFeedback }>({});
  const [savingStates, setSavingStates] = useState<{ [key: number]: boolean }>({});
  const { toast } = useToast();

  const handleRatingChange = (index: number, rating: string) => {
    setFeedbacks(prev => ({
      ...prev,
      [index]: { ...prev[index], rating }
    }));
  };

  const handleFeedbackChange = (index: number, feedback: string) => {
    setFeedbacks(prev => ({
      ...prev,
      [index]: { ...prev[index], feedback }
    }));
  };

  const handleSaveAndDownload = async (index: number) => {
    const feedback = feedbacks[index];
    if (!feedback?.rating) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before saving.",
        variant: "destructive",
      });
      return;
    }

    setSavingStates(prev => ({ ...prev, [index]: true }));
    try {
      // Save feedback for this specific variant
      const { error: feedbackError } = await supabase.from('ad_feedback').insert({
        rating: parseInt(feedback.rating),
        feedback: feedback.feedback,
        saved_images: [adImages[index]] // Save only this specific variant
      });

      if (feedbackError) throw feedbackError;

      // Download the specific variant
      const link = document.createElement('a');
      link.href = adImages[index].url;
      link.download = `ad-variant-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success!",
        description: "Your feedback has been saved and image downloaded.",
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({
        title: "Error",
        description: "Failed to save feedback or download image.",
        variant: "destructive",
      });
    } finally {
      setSavingStates(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {adImages.map((image, index) => {
        const hook = adHooks[index % adHooks.length];
        const feedback = feedbacks[index] || { rating: '', feedback: '' };
        const isSaving = savingStates[index] || false;

        return (
          <Card key={index} className="overflow-hidden">
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
                <p className="text-gray-800 font-medium">{hook.description}</p>
                <p className="text-facebook font-semibold">{hook.text}</p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h4 className="text-sm font-medium mb-2">Rate this variant</h4>
                  <RadioGroup
                    value={feedback.rating}
                    onValueChange={(value) => handleRatingChange(index, value)}
                    className="flex space-x-4 mb-4"
                  >
                    {[1, 2, 3, 4, 5].map((value) => (
                      <div key={value} className="flex items-center space-x-2">
                        <RadioGroupItem value={value.toString()} id={`rating-${index}-${value}`} />
                        <Label htmlFor={`rating-${index}-${value}`} className="flex items-center gap-1">
                          {value} <Star className="w-4 h-4" />
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Provide feedback</h4>
                  <Textarea
                    placeholder="Share your thoughts about this variant..."
                    value={feedback.feedback}
                    onChange={(e) => handleFeedbackChange(index, e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <Button
                  onClick={() => handleSaveAndDownload(index)}
                  className="w-full bg-facebook hover:bg-facebook/90"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Save & Download
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdVariantGrid;