import { useEffect, useState } from "react";
import { useAdGeneration } from "@/hooks/gallery/useAdGeneration";
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { VideoAdVariant } from "@/types/videoAdTypes";
import PlatformTabs from "./gallery/PlatformTabs";
import PlatformContent from "./gallery/PlatformContent";
import AdGenerationControls from "./gallery/AdGenerationControls";
import { useToast } from "@/hooks/use-toast";

interface AdGalleryStepProps {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  adHooks: AdHook[];
  onStartOver: () => Promise<void>;
  onBack: () => void;
  onCreateProject: () => void;
  videoAdsEnabled: boolean;
  generatedAds: any[];
  onAdsGenerated: (ads: any[]) => Promise<void>;
  hasLoadedInitialAds: boolean;
}

const AdGalleryStep = ({
  businessIdea,
  targetAudience,
  adHooks,
  onStartOver,
  onBack,
  onCreateProject,
  videoAdsEnabled,
  generatedAds,
  onAdsGenerated,
  hasLoadedInitialAds,
}: AdGalleryStepProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState("facebook");
  const { toast } = useToast();
  
  const {
    isGenerating,
    adVariants,
    videoVariants,
    generationStatus,
    generateAds,
    reset: resetAdGeneration,
  } = useAdGeneration(businessIdea, targetAudience, adHooks);

  useEffect(() => {
    const handleInitialGeneration = async () => {
      try {
        if (!hasLoadedInitialAds && !isGenerating && adVariants.length === 0) {
          console.log('Initial ads not loaded yet');
          const newAds = await generateAds(selectedPlatform);
          if (newAds && newAds.length > 0) {
            await onAdsGenerated(newAds);
          }
        }
      } catch (error) {
        console.error('Error during initial ad generation:', error);
        toast({
          title: "Error generating ads",
          description: "There was an error generating your ads. Please try again.",
          variant: "destructive",
        });
      }
    };

    handleInitialGeneration();
  }, [hasLoadedInitialAds, isGenerating, adVariants.length, generateAds, selectedPlatform, onAdsGenerated]);

  useEffect(() => {
    if (generatedAds.length === 0) {
      console.log('Resetting ad generation state due to empty generatedAds');
      resetAdGeneration();
    }
  }, [generatedAds, resetAdGeneration]);

  const handleStartOver = async () => {
    try {
      resetAdGeneration();
      await onStartOver();
    } catch (error) {
      console.error('Error during start over:', error);
      toast({
        title: "Error resetting progress",
        description: "There was an error resetting your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePlatformChange = async (platform: string) => {
    try {
      setSelectedPlatform(platform);
      const newAds = await generateAds(platform);
      if (newAds && newAds.length > 0) {
        await onAdsGenerated(newAds);
      }
    } catch (error) {
      console.error('Error during platform change:', error);
      toast({
        title: "Error changing platform",
        description: "There was an error generating ads for the selected platform. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <PlatformTabs
        selectedPlatform={selectedPlatform}
        onPlatformChange={handlePlatformChange}
      />
      
      <PlatformContent
        platform={selectedPlatform}
        isGenerating={isGenerating}
        generationStatus={generationStatus}
        adVariants={adVariants}
        videoVariants={videoVariants}
        videoAdsEnabled={videoAdsEnabled}
      />

      <AdGenerationControls
        onBack={onBack}
        onStartOver={handleStartOver}
        onCreateProject={onCreateProject}
        isGenerating={isGenerating}
      />
    </div>
  );
};

export default AdGalleryStep;