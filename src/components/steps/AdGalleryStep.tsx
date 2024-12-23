import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StepNavigation from "./complete/StepNavigation";
import LoadingState from "./complete/LoadingState";
import AdPreviewCard from "./gallery/AdPreviewCard";
import { facebookAdSpecs } from "@/types/facebookAdSpecs";
import { facebookVideoAdSpecs } from "@/types/videoAdSpecs";
import { Linkedin, Tiktok } from "lucide-react";

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
              facebook: facebookVideoAdSpecs,
              linkedin: {
                formats: ['feed', 'sponsored', 'message'],
                aspectRatios: ['1:1', '16:9']
              },
              tiktok: {
                formats: ['in-feed', 'topview', 'branded-effects'],
                aspectRatios: ['9:16']
              }
            } : {
              facebook: facebookAdSpecs,
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
          }
        }
      });

      if (error) {
        console.error('Error response:', error);
        throw error;
      }

      console.log('Generated ad variants:', data);
      setAdVariants(data.variants);
      
      toast({
        title: `${videoAdsEnabled ? 'Video Ads' : 'Image Ads'} Generated!`,
        description: "Your ad variants have been generated successfully.",
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

  return (
    <div className="space-y-6 md:space-y-8">
      <StepNavigation
        onBack={onBack}
        onStartOver={onStartOver}
      />

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Your Ad Gallery</h2>
        <p className="text-gray-600 mb-6">
          Review your generated {videoAdsEnabled ? 'video' : 'image'} ad variants optimized for different platforms and formats.
        </p>
      </div>

      {isGenerating ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">
          <Tabs defaultValue="facebook" className="w-full" onValueChange={(value) => setPlatform(value as typeof platform)}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="facebook">Facebook Ads</TabsTrigger>
              <TabsTrigger value="google">Google Ads</TabsTrigger>
              <TabsTrigger value="linkedin" className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </TabsTrigger>
              <TabsTrigger value="tiktok" className="flex items-center gap-2">
                <Tiktok className="h-4 w-4" />
                TikTok
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="facebook" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adVariants
                  .filter(variant => variant.platform === 'facebook')
                  .map((variant, index) => (
                    <AdPreviewCard
                      key={`${index}-${variant.size.label}`}
                      variant={variant}
                      onCreateProject={onCreateProject}
                      isVideo={videoAdsEnabled}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="google" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adVariants
                  .filter(variant => variant.platform === 'google')
                  .map((variant, index) => (
                    <AdPreviewCard
                      key={index}
                      variant={variant}
                      onCreateProject={onCreateProject}
                      isVideo={videoAdsEnabled}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="linkedin" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adVariants
                  .filter(variant => variant.platform === 'linkedin')
                  .map((variant, index) => (
                    <AdPreviewCard
                      key={index}
                      variant={variant}
                      onCreateProject={onCreateProject}
                      isVideo={videoAdsEnabled}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="tiktok" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adVariants
                  .filter(variant => variant.platform === 'tiktok')
                  .map((variant, index) => (
                    <AdPreviewCard
                      key={index}
                      variant={variant}
                      onCreateProject={onCreateProject}
                      isVideo={videoAdsEnabled}
                    />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default AdGalleryStep;