import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BusinessIdea, TargetAudience, AdHook, AdFormat, AdImage } from "@/types/adWizard";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import AdFeedbackForm from "./complete/AdFeedbackForm";
import AdDetails from "./complete/AdDetails";
import AdVariantGrid from "./complete/AdVariantGrid";
import StepNavigation from "./complete/StepNavigation";

interface CompleteStepProps {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  adHooks: AdHook[];
  adFormat: AdFormat;
  onStartOver: () => void;
  onBack: () => void;
}

const CompleteStep = ({
  businessIdea,
  targetAudience,
  adHooks,
  adFormat,
  onStartOver,
  onBack,
}: CompleteStepProps) => {
  const [adImages, setAdImages] = useState<AdImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [rating, setRating] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const generateImages = async () => {
    setIsGenerating(true);
    try {
      console.log('Generating images with params:', { businessIdea, targetAudience, adHooks });
      
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: 'images',
          businessIdea,
          targetAudience,
          campaign: {
            hooks: adHooks,
            format: adFormat
          }
        }
      });

      if (error) {
        console.error('Error generating images:', error);
        throw error;
      }

      if (!data?.images) {
        throw new Error('No images returned from generation');
      }

      setAdImages(data.images);
      toast({
        title: "Images Generated!",
        description: "Your ad images have been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating images:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndDownload = async () => {
    setIsSaving(true);
    try {
      const { error: feedbackError } = await supabase.from('ad_feedback').insert({
        rating: parseInt(rating),
        feedback,
        saved_images: adImages
      });

      if (feedbackError) throw feedbackError;

      adImages.forEach((image, index) => {
        const link = document.createElement('a');
        link.href = image.url;
        link.download = `ad-variant-${index + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });

      toast({
        title: "Success!",
        description: "Your feedback has been saved and images downloaded.",
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({
        title: "Error",
        description: "Failed to save feedback or download images.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (adImages.length === 0) {
      generateImages();
    }
  }, []);

  return (
    <div className="space-y-6 md:space-y-8">
      <StepNavigation
        onBack={onBack}
        onStartOver={onStartOver}
        onSaveAndDownload={handleSaveAndDownload}
        disabled={adImages.length === 0 || !rating}
        isSaving={isSaving}
      />

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Your Ad Variants</h2>
        <p className="text-gray-600">
          Review your generated ad variants, provide feedback, and download them for use.
        </p>
      </div>

      {isGenerating ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-facebook" />
            <p className="text-gray-600">Generating your ad variants...</p>
          </div>
        </Card>
      ) : (
        <>
          <AdVariantGrid
            adImages={adImages}
            adHooks={adHooks}
            businessIdea={businessIdea}
          />

          <Card className="bg-gray-50">
            <div className="p-6 space-y-6">
              <AdFeedbackForm
                rating={rating}
                feedback={feedback}
                onRatingChange={setRating}
                onFeedbackChange={setFeedback}
              />
              <AdDetails
                adFormat={adFormat}
                targetAudience={targetAudience}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default CompleteStep;