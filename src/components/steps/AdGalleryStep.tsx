
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { TabsContent } from "@/components/ui/tabs";
import LoadingState from "./complete/LoadingState";
import PlatformTabs from "./gallery/PlatformTabs";
import PlatformContent from "./gallery/PlatformContent";
import PlatformChangeDialog from "./gallery/PlatformChangeDialog";
import { usePlatformSwitch } from "@/hooks/usePlatformSwitch";
import { useAdGeneration } from "./gallery/useAdGeneration";
import AdGenerationControls from "./gallery/AdGenerationControls";
import { useEffect, useState } from "react";
import { AdSizeSelector, AD_FORMATS } from "./gallery/components/AdSizeSelector";
import { useToast } from "@/hooks/use-toast";

interface AdGalleryStepProps {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  adHooks: AdHook[];
  onStartOver: () => void;
  onBack: () => void;
  onCreateProject: () => void;
  videoAdsEnabled?: boolean;
}

const AdGalleryStep = ({
  businessIdea,
  targetAudience,
  adHooks,
  onStartOver,
  onBack,
  onCreateProject,
  videoAdsEnabled = false,
}: AdGalleryStepProps) => {
  const [selectedFormat, setSelectedFormat] = useState(AD_FORMATS[0]);
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
    state,
    generationStatus,
    generateAds,
  } = useAdGeneration(businessIdea, targetAudience, adHooks);

  useEffect(() => {
    const initializeAdsIfNeeded = async () => {
      if (!state.isInitialLoad && !state.hasSavedAds) {
        try {
          await generateAds(platform);
        } catch (error) {
          console.error("Error generating initial ads:", error);
          toast({
            title: "Error generating ads",
            description: "There was an error generating your ads. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    initializeAdsIfNeeded();
  }, [state.isInitialLoad, state.hasSavedAds, platform]);

  const onPlatformChange = async (newPlatform: string) => {
    handlePlatformChange(newPlatform, state.platformSpecificAds[newPlatform]?.variants.length > 0);
  };

  const onConfirmPlatformChange = async () => {
    const newPlatform = confirmPlatformChange();
    if (!state.platformSpecificAds[newPlatform]?.variants.length) {
      await generateAds(newPlatform);
    }
  };

  const handleRegenerate = async () => {
    try {
      await generateAds(platform);
    } catch (error) {
      console.error("Error regenerating ads:", error);
      toast({
        title: "Error regenerating ads",
        description: "There was an error regenerating your ads. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFormatChange = (format: typeof AD_FORMATS[0]) => {
    setSelectedFormat(format);
    toast({
      title: "Format updated",
      description: `Ad format changed to ${format.label}`,
    });
  };

  if (state.isInitialLoad) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <AdGenerationControls
        onBack={onBack}
        onStartOver={onStartOver}
        onRegenerate={handleRegenerate}
        isGenerating={state.platformSpecificAds[platform]?.isLoading || false}
        generationStatus={generationStatus}
      />

      <div className="flex justify-end mb-4">
        <AdSizeSelector
          selectedFormat={selectedFormat}
          onFormatChange={handleFormatChange}
        />
      </div>

      <PlatformTabs 
        platform={platform} 
        onPlatformChange={onPlatformChange}
      >
        <TabsContent value="facebook">
          <PlatformContent
            platformName="facebook"
            platformState={state.platformSpecificAds.facebook}
            onCreateProject={onCreateProject}
            videoAdsEnabled={videoAdsEnabled}
            selectedFormat={selectedFormat}
          />
        </TabsContent>
        <TabsContent value="google">
          <PlatformContent
            platformName="google"
            platformState={state.platformSpecificAds.google}
            onCreateProject={onCreateProject}
            videoAdsEnabled={videoAdsEnabled}
            selectedFormat={selectedFormat}
          />
        </TabsContent>
        <TabsContent value="linkedin">
          <PlatformContent
            platformName="linkedin"
            platformState={state.platformSpecificAds.linkedin}
            onCreateProject={onCreateProject}
            videoAdsEnabled={videoAdsEnabled}
            selectedFormat={selectedFormat}
          />
        </TabsContent>
        <TabsContent value="tiktok">
          <PlatformContent
            platformName="tiktok"
            platformState={state.platformSpecificAds.tiktok}
            onCreateProject={onCreateProject}
            videoAdsEnabled={videoAdsEnabled}
            selectedFormat={selectedFormat}
          />
        </TabsContent>
      </PlatformTabs>

      <PlatformChangeDialog
        open={showPlatformChangeDialog}
        onOpenChange={setShowPlatformChangeDialog}
        onConfirm={onConfirmPlatformChange}
        onCancel={cancelPlatformChange}
      />
    </div>
  );
};

export default AdGalleryStep;
