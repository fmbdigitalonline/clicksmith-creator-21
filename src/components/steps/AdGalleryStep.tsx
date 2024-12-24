import { useState, useEffect } from "react";
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import StepNavigation from "./complete/StepNavigation";
import LoadingState from "./complete/LoadingState";
import PlatformTabs from "./gallery/PlatformTabs";
import PlatformContent from "./gallery/PlatformContent";
import { RefreshCw } from "lucide-react";

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
  const [platform, setPlatform] = useState<"facebook" | "google" | "linkedin" | "tiktok">("facebook");
  const [regenerationCount, setRegenerationCount] = useState(0);
  const { toast } = useToast();

  const generateAds = async () => {
    setIsGenerating(true);
    try {
      console.log('Generating ads with type:', videoAdsEnabled ? 'video_ads' : 'complete_ads');
      
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: videoAdsEnabled ? 'video_ads' : 'complete_ads',
          businessIdea,
          targetAudience,
          campaign: {
            hooks: adHooks,
            specs: videoAdsEnabled ? {
              facebook: {
                formats: ['feed', 'sponsored', 'message'],
                aspectRatios: ['1:1', '16:9']
              },
              linkedin: {
                formats: ['feed', 'sponsored', 'message'],
                aspectRatios: ['1:1', '16:9']
              },
              tiktok: {
                formats: ['in-feed', 'topview', 'branded-effects'],
                aspectRatios: ['9:16']
              }
            } : {
              facebook: {
                commonSizes: [
                  { width: 250, height: 250, label: "Square" },
                  { width: 200, height: 200, label: "Small Square" },
                  { width: 468, height: 60, label: "Banner" },
                  { width: 728, height: 90, label: "Leaderboard" },
                  { width: 300, height: 250, label: "Inline Rectangle" },
                  { width: 336, height: 280, label: "Large Rectangle" },
                  { width: 120, height: 600, label: "Skyscraper" },
                  { width: 160, height: 600, label: "Wide Skyscraper" },
                  { width: 300, height: 600, label: "Half-Page Ad" },
                  { width: 970, height: 90, label: "Large Leaderboard" }
                ],
                mobileCommonSizes: [
                  { width: 300, height: 50, label: "Mobile Banner" },
                  { width: 320, height: 50, label: "Mobile Banner" },
                  { width: 320, height: 100, label: "Large Mobile Banner" }
                ]
              },
              google: {
                commonSizes: [
                  { width: 250, height: 250, label: "Square" },
                  { width: 200, height: 200, label: "Small Square" },
                  { width: 468, height: 60, label: "Banner" },
                  { width: 728, height: 90, label: "Leaderboard" },
                  { width: 300, height: 250, label: "Inline Rectangle" },
                  { width: 336, height: 280, label: "Large Rectangle" },
                  { width: 120, height: 600, label: "Skyscraper" },
                  { width: 160, height: 600, label: "Wide Skyscraper" },
                  { width: 300, height: 600, label: "Half-Page Ad" },
                  { width: 970, height: 90, label: "Large Leaderboard" }
                ],
                mobileCommonSizes: [
                  { width: 300, height: 50, label: "Mobile Banner" },
                  { width: 320, height: 50, label: "Mobile Banner" },
                  { width: 320, height: 100, label: "Large Mobile Banner" }
                ]
              },
              linkedin: {
                commonSizes: [
                  { width: 1200, height: 627, label: "Single Image Ad" },
                  { width: 1200, height: 1200, label: "Square Image" },
                  { width: 1920, height: 1080, label: "Video Ad" }
                ]
              },
              tiktok: {
                commonSizes: [
                  { width: 1080, height: 1920, label: "Full Screen" },
                  { width: 1080, height: 1080, label: "Square" }
                ]
              }
            }
          },
          regenerationCount: regenerationCount,
          timestamp: new Date().getTime()
        }
      });

      if (error) throw error;

      console.log('Generated ad variants:', data);
      setAdVariants(data.variants);
      setRegenerationCount(prev => prev + 1);
      
      toast({
        title: `Fresh ${videoAdsEnabled ? 'Video Ads' : 'Image Ads'} Generated!`,
        description: "Your new ad variants have been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating ads:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate ads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (adVariants.length === 0) {
      generateAds();
    }
  }, [videoAdsEnabled]);

  const renderPlatformContent = (platformName: string) => (
    <TabsContent value={platformName} className="space-y-4">
      <PlatformContent
        platformName={platformName}
        adVariants={adVariants}
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
        <Button
          onClick={generateAds}
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

      {isGenerating ? (
        <LoadingState />
      ) : (
        <PlatformTabs platform={platform} onPlatformChange={(value) => setPlatform(value as typeof platform)}>
          {renderPlatformContent('facebook')}
          {renderPlatformContent('google')}
          {renderPlatformContent('linkedin')}
          {renderPlatformContent('tiktok')}
        </PlatformTabs>
      )}
    </div>
  );
};

export default AdGalleryStep;
