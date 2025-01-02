import { useState, useEffect } from "react";
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import StepNavigation from "./complete/StepNavigation";
import LoadingState from "./complete/LoadingState";
import PlatformTabs from "./gallery/PlatformTabs";
import PlatformContent from "./gallery/PlatformContent";
import PlatformChangeDialog from "./gallery/PlatformChangeDialog";
import { RefreshCw } from "lucide-react";
import { usePlatformSwitch } from "@/hooks/usePlatformSwitch";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [adVariants, setAdVariants] = useState<any[]>([]);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const { toast } = useToast();
  
  const {
    platform,
    showPlatformChangeDialog,
    handlePlatformChange,
    confirmPlatformChange,
    cancelPlatformChange,
    setShowPlatformChangeDialog
  } = usePlatformSwitch();

  const validateResponse = (data: any) => {
    if (!data) {
      throw new Error('No data received from server');
    }

    const variants = data.variants || data;
    if (!Array.isArray(variants)) {
      console.error('Invalid variants format:', variants);
      throw new Error('Invalid response format: variants is not an array');
    }

    return variants;
  };

  const generateAds = async (selectedPlatform?: string) => {
    setIsGenerating(true);
    setGenerationStatus("Initializing ad generation...");
    try {
      console.log('Generating ads for platform:', selectedPlatform || platform);
      
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: videoAdsEnabled ? 'video_ads' : 'complete_ads',
          businessIdea,
          targetAudience,
          platform: selectedPlatform || platform,
          campaign: {
            hooks: adHooks,
            specs: videoAdsEnabled ? {
              [selectedPlatform || platform]: {
                formats: ['feed', 'sponsored', 'message'],
                aspectRatios: ['1:1', '16:9']
              }
            } : {
              [selectedPlatform || platform]: {
                commonSizes: [
                  { width: 1200, height: 628, label: `${selectedPlatform || platform} Feed` }
                ]
              }
            }
          },
          regenerationCount: regenerationCount,
          timestamp: new Date().getTime()
        }
      });

      if (error) throw error;

      console.log('Edge Function response:', data);

      const variants = validateResponse(data);

      const processedVariants = variants.map(variant => ({
        ...variant,
        imageUrl: variant.image?.url || variant.imageUrl,
        platform: selectedPlatform || platform,
        size: {
          width: 1200,
          height: 628,
          label: `${selectedPlatform || platform} Feed`
        }
      }));

      console.log('Processed ad variants:', processedVariants);
      setAdVariants(processedVariants);
      setRegenerationCount(prev => prev + 1);
      setGenerationStatus("Generation completed successfully!");
      
      toast({
        title: `Fresh ${videoAdsEnabled ? 'Video Ads' : 'Image Ads'} Generated!`,
        description: "Your new ad variants have been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating ads:', error);
      setGenerationStatus("Generation failed. Please try again.");
      toast({
        title: "Generation Failed",
        description: error instanceof Error 
          ? `Error: ${error.message}. Please try again or contact support.`
          : "Failed to generate ads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (adVariants.length === 0) {
      generateAds(platform);
    }
  }, [videoAdsEnabled]);

  const onPlatformChange = (newPlatform: "facebook" | "google" | "linkedin" | "tiktok") => {
    const currentPlatform = handlePlatformChange(newPlatform, adVariants.length > 0);
    if (currentPlatform === newPlatform) {
      generateAds(newPlatform);
    }
  };

  const onConfirmPlatformChange = () => {
    const newPlatform = confirmPlatformChange();
    generateAds(newPlatform);
  };

  const renderPlatformContent = (platformName: string) => (
    <TabsContent value={platformName} className="space-y-4">
      <PlatformContent
        platformName={platformName}
        adVariants={adVariants.filter(variant => variant.platform === platformName)}
        onCreateProject={onCreateProject}
        videoAdsEnabled={videoAdsEnabled}
      />
    </TabsContent>
  );

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <StepNavigation
          onBack={onBack}
          onStartOver={onStartOver}
        />
        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          {generationStatus && (
            <p className="text-sm text-gray-600">{generationStatus}</p>
          )}
          <Button
            onClick={() => generateAds(platform)}
            disabled={isGenerating}
            variant="outline"
            className="w-full md:w-auto"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            <span>Regenerate Ads</span>
          </Button>
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
        onCancel={cancelPlatformChange}
      />
    </div>
  );
};

export default AdGalleryStep;
