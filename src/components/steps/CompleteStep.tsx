import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BusinessIdea, TargetAudience, AdHook, AdFormat, AdImage } from "@/types/adWizard";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
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

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Your Ad Variants</h2>
        <p className="text-gray-600">
          Review your generated ad variants, provide feedback, and save or download them for use.
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