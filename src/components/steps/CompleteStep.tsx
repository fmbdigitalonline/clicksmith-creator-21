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
import { useParams } from "react-router-dom";

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
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { projectId } = useParams();

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
      
      // If we have a project ID, save the generated ads
      if (projectId) {
        await saveGeneratedAds(data.images);
      }

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

  const saveGeneratedAds = async (images: AdImage[]) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          generated_ads: {
            images,
            hooks: adHooks,
            format: adFormat
          }
        })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Ads Saved",
        description: "Your generated ads have been saved to the project.",
      });
    } catch (error) {
      console.error('Error saving ads:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save the generated ads. Please try again.",
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
            isSaving={isSaving}
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