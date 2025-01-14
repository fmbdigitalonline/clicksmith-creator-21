import { useAdWizardState } from "@/hooks/useAdWizardState";
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
  const [localGeneratedAds, setLocalGeneratedAds] = useState<any[]>(generatedAds);
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
  } = useAdGeneration(businessIdea, targetAudience, adHooks);

  // Update local state when props change
  useEffect(() => {
    console.log('Generated ads prop updated:', generatedAds);
    if (JSON.stringify(generatedAds) !== JSON.stringify(localGeneratedAds)) {
      setLocalGeneratedAds(generatedAds);
    }
  }, [generatedAds]);

  const handleGenerateAds = useCallback((selectedPlatform: string) => {
    if (!isGenerating) {
      console.log('Starting ad generation for platform:', selectedPlatform);
      generateAds(selectedPlatform);
      toast({
        title: "Generating Ads",
        description: "Please wait while we generate your ads...",
      });
    }
  }, [generateAds, isGenerating, toast]);

  // Effect for initial ad generation
  useEffect(() => {
    if (!hasLoadedInitialAds || hasGeneratedInitialAds) {
      console.log('Skipping initial generation:', { hasLoadedInitialAds, hasGeneratedInitialAds });
      return;
    }

    const isNewProject = projectId === 'new';
    const existingPlatformAds = localGeneratedAds.filter(ad => ad.platform === platform);
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
  }, [hasLoadedInitialAds, hasGeneratedInitialAds, platform, projectId, localGeneratedAds, handleGenerateAds]);

  // Effect for managing generated ads state
  useEffect(() => {
    if (!onAdsGenerated || adVariants.length === 0) {
      console.log('Skipping ads update:', { 
        hasCallback: !!onAdsGenerated, 
        variantsCount: adVariants.length 
      });
      return;
    }

    const isNewProject = projectId === 'new';
    let updatedAds: any[] = [];

    if (isNewProject) {
      // For new projects, keep all generated ads
      updatedAds = [...localGeneratedAds, ...adVariants];
    } else {
      // Create a map of existing ads for efficient lookup
      const existingAdsMap = new Map(
        localGeneratedAds.map(ad => [`${ad.platform}-${ad.id}`, ad])
      );

      // Update existing ads and add new ones
      adVariants.forEach(newVariant => {
        const key = `${newVariant.platform}-${newVariant.id}`;
        existingAdsMap.set(key, newVariant);
      });

      updatedAds = Array.from(existingAdsMap.values());
    }

    // Remove duplicates based on id and platform
    updatedAds = Array.from(new Map(
      updatedAds.map(ad => [`${ad.platform}-${ad.id}`, ad])
    ).values());

    console.log('Updating ads state:', { 
      isNewProject, 
      adVariantsCount: adVariants.length,
      updatedAdsCount: updatedAds.length 
    });
    
    setLocalGeneratedAds(updatedAds);
    onAdsGenerated(updatedAds);

    if (updatedAds.length > 0) {
      toast({
        title: "Ads Generated Successfully",
        description: `Generated ${adVariants.length} new ad variants.`,
      });
    }
  }, [adVariants, onAdsGenerated, projectId, localGeneratedAds, toast]);

  const onPlatformChange = (newPlatform: "facebook" | "google" | "linkedin" | "tiktok") => {
    handlePlatformChange(newPlatform, false); // Remove the condition for showing dialog
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

  const renderPlatformContent = (platformName: string) => {
    // Filter ads for the current platform
    const platformAds = localGeneratedAds.filter(ad => ad.platform === platformName);
    
    return (
      <TabsContent value={platformName} className="space-y-4">
        <div className="flex justify-end mb-4">
          <AdSizeSelector
            selectedFormat={selectedFormat}
            onFormatChange={handleFormatChange}
          />
        </div>
        <PlatformContent
          platformName={platformName}
          adVariants={platformAds}
          onCreateProject={onCreateProject}
          videoAdsEnabled={videoAdsEnabled}
          selectedFormat={selectedFormat}
        />
      </TabsContent>
    );
  };

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
