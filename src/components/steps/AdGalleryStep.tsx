import { BusinessIdea, TargetAudience, AdHook, AdImage } from "@/types/adWizard";
import { TabsContent } from "@/components/ui/tabs";
import LoadingState from "./complete/LoadingState";
import PlatformTabs from "./gallery/PlatformTabs";
import PlatformContent from "./gallery/PlatformContent";
import PlatformChangeDialog from "./gallery/PlatformChangeDialog";
import { usePlatformSwitch } from "@/hooks/usePlatformSwitch";
import { useAdGeneration } from "@/hooks/gallery/useAdGeneration";
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

  useEffect(() => {
    if (!hasLoadedInitialAds || hasGeneratedInitialAds) return;

    const isNewProject = projectId === 'new';
    const existingPlatformAds = generatedAds.filter(ad => ad.platform === platform);
    
    if (isNewProject && existingPlatformAds.length === 0) {
      console.log('Generating initial ads for new project:', { 
        platform, 
        existingAdsCount: existingPlatformAds.length
      });
      handleGenerateAds(platform);
    }

    setHasGeneratedInitialAds(true);
  }, [hasLoadedInitialAds, hasGeneratedInitialAds, platform, projectId, generatedAds, handleGenerateAds]);

  useEffect(() => {
    if (!onAdsGenerated || adVariants.length === 0) return;

    const processedVariants = adVariants.map(variant => ({
      platform: variant.platform,
      headline: variant.headline,
      description: variant.description,
      imageUrl: variant.imageUrl,
      size: variant.size || getPlatformSize(variant.platform)
    }));

    const updatedAds = [...generatedAds];
    
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
      adVariantsCount: processedVariants.length,
      updatedAdsCount: updatedAds.length,
      platform
    });
    
    onAdsGenerated(updatedAds);
  }, [adVariants, onAdsGenerated, generatedAds, platform]);

  const getPlatformSize = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'tiktok':
        return { width: 1080, height: 1920, label: "TikTok Feed" };
      case 'linkedin':
        return { width: 1200, height: 627, label: "LinkedIn Feed" };
      case 'google':
        return { width: 1200, height: 628, label: "Google Display" };
      default:
        return { width: 1200, height: 628, label: "Facebook Feed" };
    }
  };

  const onPlatformChange = useCallback((newPlatform: "facebook" | "google" | "linkedin" | "tiktok") => {
    handlePlatformChange(newPlatform, adVariants.length > 0);
  }, [handlePlatformChange, adVariants.length]);

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