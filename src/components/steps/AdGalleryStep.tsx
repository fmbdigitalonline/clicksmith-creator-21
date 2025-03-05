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
import { useFacebookIntegration } from "@/hooks/useFacebookIntegration";
import { FacebookConnect } from "@/components/facebook/FacebookConnect";
import { CampaignCreationDialog } from "@/components/facebook/CampaignCreationDialog";
import { Button } from "@/components/ui/button";
import { FaFacebook } from "react-icons/fa";
// Add Dialog component imports
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";

interface AdGalleryStepProps {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  adHooks: AdHook[];
  onStartOver: () => void;
  onBack: () => void;
  onCreateProject: () => void;
  videoAdsEnabled?: boolean;
  projectId?: string;
}

const AdGalleryStep = ({
  businessIdea,
  targetAudience,
  adHooks,
  onStartOver,
  onBack,
  onCreateProject,
  videoAdsEnabled = false,
  projectId,
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
  } = useAdGeneration(businessIdea, targetAudience, adHooks);

  // Facebook integration
  const {
    connectionStatus,
    isPublishing,
    checkFacebookConnection,
    publishToFacebook,
  } = useFacebookIntegration();

  const [showFacebookConnect, setShowFacebookConnect] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);

  // Check Facebook connection on component mount
  useEffect(() => {
    if (platform === 'facebook') {
      checkFacebookConnection();
    }
  }, [platform, checkFacebookConnection]);

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

  const handlePublishToFacebook = async () => {
    if (connectionStatus !== "connected") {
      setShowFacebookConnect(true);
      return;
    }

    // If connected, show campaign creation dialog
    setShowCampaignDialog(true);
  };

  const handleCampaignCreated = async (campaignId: string) => {
    try {
      // Here we would integrate with the actual Facebook API
      // For now, just show a success message
      toast({
        title: "Campaign created",
        description: `Campaign created with ID: ${campaignId}`,
      });
    } catch (error) {
      console.error("Error in campaign creation:", error);
      toast({
        title: "Error",
        description: "Failed to complete campaign creation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderPlatformContent = (platformName: string) => (
    <TabsContent value={platformName} className="space-y-4">
      {platformName === 'facebook' && (
        <div className="flex justify-between items-center mb-4">
          <AdSizeSelector
            selectedFormat={selectedFormat}
            onFormatChange={handleFormatChange}
          />
          
          <Button
            variant="facebook"
            onClick={handlePublishToFacebook}
            disabled={isGenerating || isPublishing || adVariants.length === 0}
          >
            <FaFacebook className="mr-2" />
            Publish to Facebook
          </Button>
        </div>
      )}
      
      {platformName !== 'facebook' && (
        <div className="flex justify-end mb-4">
          <AdSizeSelector
            selectedFormat={selectedFormat}
            onFormatChange={handleFormatChange}
          />
        </div>
      )}
      
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

      {/* Facebook Connect Dialog */}
      <Dialog 
        open={showFacebookConnect} 
        onOpenChange={setShowFacebookConnect}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Connect to Facebook</DialogTitle>
            <DialogDescription>
              You need to connect to Facebook before publishing ads.
            </DialogDescription>
          </DialogHeader>
          <FacebookConnect onConnected={() => {
            setShowFacebookConnect(false);
            setShowCampaignDialog(true);
          }} />
        </DialogContent>
      </Dialog>

      {/* Campaign Creation Dialog */}
      <CampaignCreationDialog 
        open={showCampaignDialog}
        onOpenChange={setShowCampaignDialog}
        projectId={projectId || ""}
        businessIdea={businessIdea}
        targetAudience={targetAudience}
        adVariants={adVariants.filter(variant => variant.platform === 'facebook')}
        onSuccess={handleCampaignCreated}
      />
    </div>
  );
};

export default AdGalleryStep;
