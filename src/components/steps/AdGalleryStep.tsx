
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
import { Button } from "@/components/ui/button";
import { Facebook } from "lucide-react";
import { CampaignCreationDialog } from "../facebook/CampaignCreationDialog";
import { useParams } from "react-router-dom";

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
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const { toast } = useToast();
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

  useEffect(() => {
    const initializeAds = async () => {
      if (adVariants.length === 0) {
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
      toast({
        title: "Error generating ads",
        description: "There was an error generating ads for the new platform. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onCancelPlatformChange = () => {
    const currentPlatform = cancelPlatformChange();
    // Force update the PlatformTabs to stay on the current platform
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
      toast({
        title: "Error regenerating ads",
        description: "There was an error regenerating your ads. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateCampaign = () => {
    setShowCampaignDialog(true);
  };

  const renderPlatformContent = (platformName: string) => (
    <TabsContent value={platformName} className="space-y-4">
      <div className="flex justify-between mb-4 items-center">
        <AdSizeSelector
          selectedFormat={selectedFormat}
          onFormatChange={handleFormatChange}
        />
        
        {platformName === 'facebook' && adVariants.filter(v => v.platform === platformName).length > 0 && (
          <Button 
            variant="facebook" 
            size="sm"
            className="flex items-center gap-2"
            onClick={handleCreateCampaign}
          >
            <Facebook className="h-4 w-4" />
            Create Ad Campaign
          </Button>
        )}
      </div>
      <PlatformContent
        platformName={platformName}
        adVariants={adVariants.filter(variant => variant.platform === platformName)}
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
      
      {projectId && (
        <CampaignCreationDialog 
          open={showCampaignDialog}
          onOpenChange={setShowCampaignDialog}
          projectId={projectId}
          adVariants={adVariants.filter(v => v.platform === 'facebook')}
          businessIdea={businessIdea}
          targetAudience={targetAudience}
        />
      )}
    </div>
  );
};

export default AdGalleryStep;
