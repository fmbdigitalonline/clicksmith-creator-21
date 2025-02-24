
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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
  // Find the square format (1:1) and use it as default, fallback to first format if not found
  const defaultFormat = AD_FORMATS.find(format => format.width === 1080 && format.height === 1080) || AD_FORMATS[0];
  const [selectedFormat, setSelectedFormat] = useState(defaultFormat);
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
  } = useAdGeneration();

  useEffect(() => {
    const initializeAds = async () => {
      if (adVariants.length === 0) {
        try {
          await generateAds(platform);
        } catch (error) {
          console.error("Error generating initial ads:", error);
          
          let errorMessage = "There was an error generating your ads.";
          let description = "Please try again or contact support if the issue persists.";
          
          if (error instanceof Error && error.message?.includes("NSFW content detected")) {
            errorMessage = "Content Safety Alert";
            description = "Our AI detected potentially inappropriate content in your request. Please modify your description to focus on appropriate, family-friendly content and try again.";
          }
          
          toast({
            title: errorMessage,
            description: description,
            variant: "destructive",
          });
        }
      }
    };

    initializeAds();
  }, [platform, videoAdsEnabled]);

  const onPlatformChange = async (newPlatform: "facebook" | "google" | "linkedin" | "tiktok") => {
    try {
      handlePlatformChange(newPlatform, adVariants.length > 0);
    } catch (error) {
      console.error("Error changing platform:", error);
      toast({
        title: "Error changing platform",
        description: "There was an error changing the platform. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onConfirmPlatformChange = async () => {
    try {
      const newPlatform = confirmPlatformChange();
      await generateAds(newPlatform);
    } catch (error) {
      console.error("Error confirming platform change:", error);
      
      let errorMessage = "Error generating ads";
      let description = "There was an error generating ads for the new platform. Please try again.";
      
      if (error instanceof Error && error.message?.includes("NSFW content detected")) {
        errorMessage = "Content Safety Alert";
        description = "Our AI detected potentially inappropriate content in your request. Please modify your description to focus on appropriate, family-friendly content and try again.";
      }
      
      toast({
        title: errorMessage,
        description: description,
        variant: "destructive",
      });
    }
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

  const handleRegenerate = async () => {
    try {
      await generateAds(platform);
    } catch (error) {
      console.error("Error regenerating ads:", error);
      
      let errorMessage = "Error regenerating ads";
      let description = "There was an error regenerating your ads. Please try again.";
      
      if (error instanceof Error && error.message?.includes("NSFW content detected")) {
        errorMessage = "Content Safety Alert";
        description = "Our AI detected potentially inappropriate content in your request. Please modify your description to focus on appropriate, family-friendly content and try again.";
      }
      
      toast({
        title: errorMessage,
        description: description,
        variant: "destructive",
      });
    }
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
        adVariants={adVariants}
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
        onRegenerate={handleRegenerate}
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
