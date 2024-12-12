import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BusinessIdea, TargetAudience, AdHook, AdFormat, AdImage } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import AdDetails from "./complete/AdDetails";
import AdVariantGrid from "./complete/AdVariantGrid";
import StepNavigation from "./complete/StepNavigation";
import LoadingState from "./complete/LoadingState";
import Header from "./complete/Header";

interface CompleteStepProps {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  adHooks: AdHook[];
  adFormat: AdFormat;
  onStartOver: () => void;
  onBack: () => void;
  onCreateProject: () => void;
}

const CompleteStep = ({
  businessIdea,
  targetAudience,
  adHooks,
  adFormat,
  onStartOver,
  onBack,
  onCreateProject,
}: CompleteStepProps) => {
  const [adImages, setAdImages] = useState<AdImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateImages = async () => {
    setIsGenerating(true);
    try {
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

      if (error) throw error;
      if (!data?.images) throw new Error('No images returned from generation');

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
      />

      <Header
        title="Your Ad Variants"
        description="Review your generated ad variants, provide feedback, and save or download them for use."
      />

      {isGenerating ? (
        <LoadingState />
      ) : (
        <>
          <AdVariantGrid
            adImages={adImages}
            adHooks={adHooks}
            businessIdea={businessIdea}
            onCreateProject={onCreateProject}
          />

          <Card className="bg-gray-50">
            <div className="p-6">
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