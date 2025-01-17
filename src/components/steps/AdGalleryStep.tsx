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
import { useToast } from "@/hooks/use-toast";

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
}: AdGalleryStepProps) => {
  const [selectedFormat, setSelectedFormat] = useState(AD_FORMATS[0]);
  const [hasGeneratedInitialAds, setHasGeneratedInitialAds] = useState(false);
  const { projectId } = useParams();
  const { toast } = useToast();
  
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
    resetGeneration
  } = useAdGeneration(businessIdea, targetAudience, adHooks);

  const handleGenerateAds = useCallback(async (selectedPlatform: string) => {
    if (!isGenerating) {
      try {
        console.log('Starting ad generation for platform:', selectedPlatform);
        await generateAds(selectedPlatform);
      } catch (error) {
        console.error('Error generating ads:', error);
        toast({
          title: "Error generating ads",
          description: "Failed to generate ads. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [generateAds, isGenerating, toast]);

  // Effect for initial ad generation
  useEffect(() => {
    if (!hasLoadedInitialAds || hasGeneratedInitialAds) return;

    const isNewProject = projectId === 'new';
    const existingPlatformAds = generatedAds.filter(ad => ad.platform === platform);
    const shouldGenerateAds = isNewProject || existingPlatformAds.length === 0;

    if (shouldGenerateAds) {
      console.log('Generating initial ads:', { 
        isNewProject, 
        platform, 
        existingAdsCount: existingPlatformAds.length,
        hasLoadedInitialAds,
        hasGeneratedInitialAds
      });
      handleGenerateAds(platform);
    }

    setHasGeneratedInitialAds(true);
  }, [hasLoadedInitialAds, hasGeneratedInitialAds, platform, projectId, generatedAds, handleGenerateAds]);

  // Effect for managing generated ads state
  useEffect(() => {
    if (!onAdsGenerated || adVariants.length === 0) return;

    const isNewProject = projectId === 'new';
    
    const processedVariants = adVariants.map(variant => ({
      platform: variant.platform,
      headline: variant.headline,
      description: variant.description,
      imageUrl: variant.imageUrl,
      size: {
        width: platform === 'tiktok' ? 1080 : 1200,
        height: platform === 'tiktok' ? 1920 : 628,
        label: platform === 'tiktok' ? "TikTok Feed" : `${platform.charAt(0).toUpperCase() + platform.slice(1)} Feed`
      }
    }));

    let updatedAds = isNewProject 
      ? processedVariants
      : [...generatedAds];

    // Update existing ads or add new ones
    processedVariants.forEach(newVariant => {
      const existingIndex = updatedAds.findIndex(
        ad => ad.platform === newVariant.platform && ad.headline === newVariant.headline
      );
      
      if (existingIndex !== -1) {
        updatedAds[existingIndex] = newVariant;
      } else {
        updatedAds.push(newVariant);
      }
    });

    console.log('Updating ads state:', { 
      isNewProject, 
      adVariantsCount: processedVariants.length,
      updatedAdsCount: updatedAds.length,
      platform
    });
    
    onAdsGenerated(updatedAds);
  }, [adVariants, onAdsGenerated, projectId, generatedAds, platform]);

  const onPlatformChange = (newPlatform: "facebook" | "google" | "linkedin" | "tiktok") => {
    handlePlatformChange(newPlatform, adVariants.length > 0);
    resetGeneration();
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

  const renderPlatformContent = (platformName: string) => (
    <TabsContent value={platformName} className="space-y-4">
      <div className="flex justify-end mb-4">
        <AdSizeSelector
          selectedFormat={selectedFormat}
          onFormatChange={handleFormatChange}
        />
      </div>
      <PlatformContent
        platformName={platformName}
        adVariants={generatedAds.length > 0 ? generatedAds : adVariants}
        onCreateProject={onCreateProject}
        videoAdsEnabled={videoAdsEnabled}
        selectedFormat={selectedFormat}
      />
    </TabsContent>
  );

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
        <LoadingState />
      ) : (
        <PlatformTabs 
          platform={platform} 
          onPlatformChange={onPlatformChange}
        >
          {renderPlatformContent('facebook')}
          {renderPlatformContent('google')}
          {renderPlatformContent('linkedin')}
          {renderPlatformContent('tiktok')}
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