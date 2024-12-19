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
  const [platform, setPlatform] = useState<"facebook" | "google">("facebook");
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
              formats: ['feed', 'stories', 'carousel', 'cover']
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
      setAdVariants(data.variants || []);
      
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

  const renderAdGrid = (variants: any[]) => {
    const formatGroups = variants.reduce((acc: any, variant: any) => {
      const format = variant.size.label || variant.format;
      if (!acc[format]) {
        acc[format] = [];
      }
      acc[format].push(variant);
      return acc;
    }, {});

    return Object.entries(formatGroups).map(([format, variants]: [string, any]) => (
      <div key={format} className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 mt-6">{format}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {variants.map((variant: any, index: number) => (
            <div key={`${format}-${index}`} className="flex flex-col h-full">
              <AdPreviewCard
                variant={variant}
                onCreateProject={onCreateProject}
                isVideo={videoAdsEnabled}
              />
            </div>
          ))}
        </div>
      </div>
    ));
  };

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
          <Tabs defaultValue="facebook" className="w-full" onValueChange={(value) => setPlatform(value as "facebook" | "google")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="facebook">Facebook Ads</TabsTrigger>
              <TabsTrigger value="google">Google Ads</TabsTrigger>
            </TabsList>
            
            <TabsContent value="facebook" className="space-y-4">
              {renderAdGrid(adVariants.filter(variant => variant.platform === 'facebook'))}
            </TabsContent>

            <TabsContent value="google" className="space-y-4">
              {renderAdGrid(adVariants.filter(variant => variant.platform === 'google'))}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default AdGalleryStep;