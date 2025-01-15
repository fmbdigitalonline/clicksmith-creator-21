import { BusinessIdea, TargetAudience, AdHook, AdImage } from "@/types/adWizard";
import { TabsContent } from "@/components/ui/tabs";
import LoadingState from "./complete/LoadingState";
import PlatformTabs from "./gallery/PlatformTabs";
import PlatformContent from "./gallery/PlatformContent";
import PlatformChangeDialog from "./gallery/PlatformChangeDialog";
import { usePlatformSwitch } from "@/hooks/usePlatformSwitch";
import { useAdGeneration } from "./gallery/useAdGeneration";
import AdGenerationControls from "./gallery/AdGenerationControls";
import { useEffect, useState, useCallback } from "react";
import { AdSizeSelector, AD_FORMATS } from "./gallery/components/AdSizeSelector";
import { useParams } from "react-router-dom";

interface AdGalleryStepProps {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  adHooks: AdHook[];
  generatedImages?: AdImage[];
  onStartOver: () => void;
  onBack: () => void;
  onCreateProject: () => void;
  videoAdsEnabled?: boolean;
  generatedAds?: any[];
  onAdsGenerated?: (ads: any[]) => void;
  hasLoadedInitialAds?: boolean;
  isLoadingAds?: boolean;
}

const AdGalleryStep = ({
  businessIdea,
  targetAudience,
  adHooks,
  generatedImages,
  onStartOver,
  onBack,
  onCreateProject,
  videoAdsEnabled = false,
  generatedAds = [],
  onAdsGenerated,
  hasLoadedInitialAds = false,
  isLoadingAds = false
}: AdGalleryStepProps) => {
  const [selectedFormat, setSelectedFormat] = useState(AD_FORMATS[0]);
  const [hasGeneratedInitialAds, setHasGeneratedInitialAds] = useState(false);
  const { projectId } = useParams();
  const {
    platform,
    showPlatformChangeDialog,
    handlePlatformChange,
    confirmPlatformChange,
    cancelPlatformChange,
    setShowPlatformChangeDialog
  } = usePlatformSwitch();

  const {
    isGenerating,
    adVariants,
    generationStatus,
    generateAds,
  } = useAdGeneration(businessIdea, targetAudience, adHooks);

  const handleGenerateAds = useCallback((selectedPlatform: string) => {
    if (!isGenerating) {
      generateAds(selectedPlatform);
    }
  }, [generateAds, isGenerating]);

  // Effect for initial ad generation
  useEffect(() => {
    if (isLoadingAds || !hasLoadedInitialAds || hasGeneratedInitialAds) return;

    const isNewProject = projectId === 'new';
    const existingPlatformAds = generatedAds.filter(ad => ad.platform === platform);
    const shouldGenerateAds = isNewProject || existingPlatformAds.length === 0;

    if (shouldGenerateAds) {
      console.log('Generating initial ads:', { 
        isNewProject, 
        platform, 
        existingAdsCount: existingPlatformAds.length 
      });
      handleGenerateAds(platform);
    }

    setHasGeneratedInitialAds(true);
  }, [
    hasLoadedInitialAds, 
    hasGeneratedInitialAds, 
    platform, 
    projectId, 
    generatedAds, 
    handleGenerateAds,
    isLoadingAds
  ]);

  // Effect for managing generated ads state
  useEffect(() => {
    if (!onAdsGenerated || adVariants.length === 0) return;

    const isNewProject = projectId === 'new';
    const updatedAds = isNewProject 
      ? adVariants // For new projects, use only new variants
      : generatedAds.map(existingAd => {
          // Find if there's a new variant for this ad
          const newVariant = adVariants.find(
            variant => variant.platform === existingAd.platform && variant.id === existingAd.id
          );
          return newVariant || existingAd;
        });

    // Add any new variants that don't exist in the current ads
    if (!isNewProject) {
      adVariants.forEach(newVariant => {
        const exists = updatedAds.some(
          ad => ad.platform === newVariant.platform && ad.id === newVariant.id
        );
        if (!exists) {
          updatedAds.push(newVariant);
        }
      });
    }

    console.log('Updating ads state:', { 
      isNewProject, 
      adVariantsCount: adVariants.length,
      updatedAdsCount: updatedAds.length 
    });
    
    onAdsGenerated(updatedAds);
  }, [adVariants, onAdsGenerated, projectId, generatedAds]);

  const onPlatformChange = (newPlatform: "facebook" | "google" | "linkedin" | "tiktok") => {
    handlePlatformChange(newPlatform, adVariants.length > 0);
  };

  const onConfirmPlatformChange = () => {
    const newPlatform = confirmPlatformChange();
    handleGenerateAds(newPlatform);
  };

  const onCancelPlatformChange = () => {
    const currentPlatform = cancelPlatformChange();
    const tabsElement = document.querySelector(`[data-state="active"][value="${currentPlatform}"]`);
    if (tabsElement) {
      (tabsElement as HTMLElement).click();
    }
  };

  const handleFormatChange = (format: typeof AD_FORMATS[0]) => {
    setSelectedFormat(format);
  };

  if (isLoadingAds) {
    return <LoadingState message="Loading saved ads..." />;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <AdGenerationControls
        onBack={onBack}
        onStartOver={onStartOver}
        onRegenerate={() => handleGenerateAds(platform)}
        isGenerating={isGenerating}
        generationStatus={generationStatus}
      />

      {isGenerating ? (
        <LoadingState message="Generating new ads..." />
      ) : (
        <PlatformTabs 
          platform={platform} 
          onPlatformChange={onPlatformChange}
        >
          <TabsContent value="facebook">
            <PlatformContent
              platformName="facebook"
              businessIdea={businessIdea}
              targetAudience={targetAudience}
              adHooks={adHooks}
              onCreateProject={onCreateProject}
              generatedAds={generatedAds.filter(ad => ad.platform === "facebook")}
            />
          </TabsContent>
          <TabsContent value="google">
            <PlatformContent
              platformName="google"
              businessIdea={businessIdea}
              targetAudience={targetAudience}
              adHooks={adHooks}
              onCreateProject={onCreateProject}
              generatedAds={generatedAds.filter(ad => ad.platform === "google")}
            />
          </TabsContent>
          <TabsContent value="linkedin">
            <PlatformContent
              platformName="linkedin"
              businessIdea={businessIdea}
              targetAudience={targetAudience}
              adHooks={adHooks}
              onCreateProject={onCreateProject}
              generatedAds={generatedAds.filter(ad => ad.platform === "linkedin")}
            />
          </TabsContent>
          <TabsContent value="tiktok">
            <PlatformContent
              platformName="tiktok"
              businessIdea={businessIdea}
              targetAudience={targetAudience}
              adHooks={adHooks}
              onCreateProject={onCreateProject}
              generatedAds={generatedAds.filter(ad => ad.platform === "tiktok")}
            />
          </TabsContent>
        </PlatformTabs>
      )}

      <PlatformChangeDialog
        open={showPlatformChangeDialog}
        onOpenChange={setShowPlatformChangeDialog}
        onConfirm={onConfirmPlatformChange}
        onCancel={onCancelPlatformChange}
      />
    </div>
  );
};

export default AdGalleryStep;