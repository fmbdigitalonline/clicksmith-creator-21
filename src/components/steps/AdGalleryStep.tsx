
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
import { ProjectSelector } from "../gallery/components/ProjectSelector";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Loader2, SquareCheckIcon, Save, InfoIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FacebookAdSettings, type FacebookAdSettings as FacebookAdSettingsType } from "./gallery/components/FacebookAdSettings";

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
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [manualProcessingNeeded, setManualProcessingNeeded] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [showCampaignHelp, setShowCampaignHelp] = useState(false);
  const [facebookAdSettings, setFacebookAdSettings] = useState<FacebookAdSettingsType>({
    websiteUrl: "https://example.com",
    visibleLink: "example.com",
    language: "en_US",
    browserAddOns: {
      blockBrowserExtensions: false,
      blockPlugins: false
    },
    urlParameters: "utm_source=facebook&utm_medium=cpc"
  });
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
    processingStatus,
    generateAds,
    processImagesForFacebook
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

  // Check if there are Facebook ads that need manual processing
  useEffect(() => {
    if (platform === 'facebook' && adVariants.length > 0) {
      const needsProcessing = adVariants.some(ad => 
        ad.platform === 'facebook' && 
        (!ad.image_status || ad.image_status === 'pending')
      );
      
      setManualProcessingNeeded(needsProcessing);
    } else {
      setManualProcessingNeeded(false);
    }
  }, [platform, adVariants]);

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

  const handleFacebookSettingsChange = (settings: FacebookAdSettingsType) => {
    setFacebookAdSettings(settings);
    console.log("Facebook ad settings updated:", settings);
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

  const handleAdSelect = (adId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedAdIds(prev => [...prev, adId]);
    } else {
      setSelectedAdIds(prev => prev.filter(id => id !== adId));
    }
  };

  const handleSelectAll = () => {
    const platformAds = adVariants.filter(ad => ad.platform === platform);
    if (selectedAdIds.length === platformAds.length) {
      setSelectedAdIds([]);
    } else {
      setSelectedAdIds(platformAds.map(ad => ad.id));
    }
  };

  const handleProjectSelect = (projectId: string) => {
    console.log("Project selected in AdGalleryStep:", projectId);
    setSelectedProjectId(projectId);
  };

  const handleAssignToProject = async () => {
    setIsAssigning(true);
    try {
      if (!selectedProjectId || selectedAdIds.length === 0) {
        toast({
          title: "Selection required",
          description: "Please select both ads and a project.",
          variant: "destructive",
        });
        return;
      }

      const selectedAds = adVariants.filter(ad => selectedAdIds.includes(ad.id));
      const savedAds = [];
      
      for (const ad of selectedAds) {
        const imageUrl = ad.imageUrl || ad.image?.url;
        if (!imageUrl) {
          console.warn("Ad missing image URL:", ad);
          continue;
        }

        // Include Facebook ad settings for facebook platform ads
        const additionalMetadata = ad.platform === 'facebook' ? { facebookAdSettings } : {};

        const { data, error } = await supabase
          .from('ad_feedback')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            project_id: selectedProjectId,
            saved_images: [imageUrl],
            primary_text: ad.description,
            headline: ad.headline,
            imageUrl: imageUrl,
            platform: ad.platform,
            size: ad.size || selectedFormat,
            feedback: 'saved',
            rating: 5,
            metadata: additionalMetadata
          });

        if (error) {
          console.error("Error saving ad to project:", error);
          throw error;
        }
        
        savedAds.push(data);
      }

      toast({
        title: "Ads saved to project",
        description: `${selectedAdIds.length} ad(s) saved to project successfully.`,
      });
      
      setSelectedAdIds([]);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error assigning ads to project:', error);
      toast({
        title: "Error",
        description: "Failed to save ads to project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle processing of Facebook images
  const handleProcessFacebookImages = async () => {
    if (platform !== 'facebook') return;
    
    setIsProcessingImages(true);
    try {
      // Get all Facebook ads that need processing
      const facebookAds = adVariants.filter(ad => 
        ad.platform === 'facebook' && 
        (!ad.image_status || ad.image_status === 'pending')
      );
      
      if (facebookAds.length === 0) {
        toast({
          title: "No images to process",
          description: "All Facebook ads are already processed or processing.",
        });
        return;
      }
      
      // Process the Facebook images
      await processImagesForFacebook(facebookAds);
      
      toast({
        title: "Processing Facebook Images",
        description: `Started processing ${facebookAds.length} images for Facebook ads. This may take a moment.`,
      });
      
      // Update UI to show no manual processing is needed
      setManualProcessingNeeded(false);
    } catch (error) {
      console.error("Error processing Facebook images:", error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process Facebook images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingImages(false);
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
      {platformName === 'facebook' && (
        <div className="mb-4">
          <FacebookAdSettings 
            onChange={handleFacebookSettingsChange}
            initialSettings={facebookAdSettings}
          />
        </div>
      )}
      <PlatformContent
        platformName={platformName}
        adVariants={adVariants.filter(variant => variant.platform === platformName)}
        onCreateProject={onCreateProject}
        videoAdsEnabled={videoAdsEnabled}
        selectedFormat={selectedFormat}
        selectable={true}
        selectedAdIds={selectedAdIds}
        onAdSelect={handleAdSelect}
      />
    </TabsContent>
  );

  // Calculate progress percentage for the processing status bar
  const progressPercentage = processingStatus.inProgress 
    ? Math.round(((processingStatus.completed + processingStatus.failed) / processingStatus.total) * 100)
    : 0;

  return (
    <div className="space-y-6 md:space-y-8">
      <AdGenerationControls
        onBack={onBack}
        onStartOver={onStartOver}
        onRegenerate={handleRegenerate}
        isGenerating={isGenerating}
        generationStatus={generationStatus}
      />

      {/* Processing Status Bar */}
      {processingStatus.inProgress && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 text-blue-500 animate-spin" />
              <h3 className="text-sm font-medium text-blue-700">
                Processing images for Facebook
              </h3>
            </div>
            <span className="text-sm text-blue-700 font-medium">
              {processingStatus.completed + processingStatus.failed} of {processingStatus.total} complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-blue-600">
            <span>{processingStatus.completed} successful</span>
            {processingStatus.failed > 0 && (
              <span className="text-red-500">{processingStatus.failed} failed</span>
            )}
          </div>
        </div>
      )}

      {/* Facebook Campaign Help Dialog */}
      <AlertDialog open={showCampaignHelp} onOpenChange={setShowCampaignHelp}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Understanding Facebook Ad Campaigns</AlertDialogTitle>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm">
              Here's what you need to know about how Facebook ad campaigns work:
            </p>
            
            <div className="space-y-2">
              <h3 className="font-medium">Why can't I see my campaign in Facebook Ads Manager?</h3>
              <ul className="list-disc pl-6 text-sm space-y-1">
                <li>All campaigns created through our app are initially set to <strong>PAUSED</strong> status on Facebook.</li>
                <li>You need to activate them within our app by clicking "Activate Campaign" on the status page after creation.</li>
                <li>There may be a delay (up to 30 minutes) before new campaigns appear in Facebook Ads Manager.</li>
                <li>Make sure you're looking at the correct Ad Account in Facebook Ads Manager.</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Why do images need to be processed for Facebook?</h3>
              <ul className="list-disc pl-6 text-sm space-y-1">
                <li>Facebook requires images to be uploaded to their system before they can be used in ads.</li>
                <li>We first store your images in our secure storage for reliability.</li>
                <li>Then we process them for Facebook's ad system through their API.</li>
                <li>This ensures images comply with Facebook's technical requirements and content policies.</li>
                <li>This process is necessary and cannot be skipped for Facebook ads to function properly.</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">How long does the process take?</h3>
              <ul className="list-disc pl-6 text-sm space-y-1">
                <li>Image processing usually takes 1-2 minutes per image.</li>
                <li>Campaign creation takes approximately 2-5 minutes.</li>
                <li>New campaigns may take up to 30 minutes to appear in Facebook Ads Manager.</li>
              </ul>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogAction>I understand</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Facebook Processing Button + Help Button */}
      {platform === 'facebook' && (
        <div className="flex items-start gap-4">
          {manualProcessingNeeded && (
            <Alert variant="warning" className="flex justify-between items-center flex-1">
              <div>
                <AlertTitle>Image Processing Required for Facebook Ads</AlertTitle>
                <AlertDescription className="text-xs">
                  To use these ads on Facebook, they need to be processed. This makes them compatible with Facebook's ad system.
                </AlertDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleProcessFacebookImages}
                disabled={isProcessingImages}
                className="bg-white ml-4"
              >
                {isProcessingImages ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Process Facebook Images'
                )}
              </Button>
            </Alert>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCampaignHelp(true)}
            className="bg-white text-sm flex-shrink-0"
          >
            <InfoIcon className="h-4 w-4 mr-2" />
            About Facebook Campaigns
          </Button>
        </div>
      )}

      {/* Project Assignment Controls */}
      <div className="bg-slate-50 p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex items-center"
            >
              {adVariants.filter(ad => ad.platform === platform).length === selectedAdIds.length ? (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Deselect All
                </>
              ) : (
                <>
                  <SquareCheckIcon className="h-4 w-4 mr-2" />
                  Select All
                </>
              )}
            </Button>
            {selectedAdIds.length > 0 && (
              <Badge variant="secondary" className="bg-slate-200 text-slate-800">
                {selectedAdIds.length} selected
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="w-full sm:w-64">
              <ProjectSelector
                selectedProjectId={selectedProjectId}
                onSelect={handleProjectSelect}
                required={selectedAdIds.length > 0}
                errorMessage="Please select a project to save ads"
              />
            </div>
            
            <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="default" 
                  disabled={selectedAdIds.length === 0 || !selectedProjectId || isAssigning}
                  className="whitespace-nowrap bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    if (selectedAdIds.length > 0 && selectedProjectId) {
                      setIsConfirmDialogOpen(true);
                    }
                  }}
                >
                  {isAssigning ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save to Project
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Save Ads to Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to save {selectedAdIds.length} ad(s) to the selected project?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAssignToProject}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

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
