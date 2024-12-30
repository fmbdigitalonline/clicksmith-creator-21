import { useState, useEffect } from "react";
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { TabsContent } from "@/components/ui/tabs";
import LoadingState from "./complete/LoadingState";
import PlatformTabs from "./gallery/PlatformTabs";
import PlatformContent from "./gallery/PlatformContent";
import GalleryHeader from "./gallery/GalleryHeader";
import { getVideoAdSpecs, getImageAdSpecs, platformConfig } from "./gallery/AdGenerationConfig";

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
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const { toast } = useToast();

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

  const generateAds = async () => {
    setIsGenerating(true);
    setGenerationStatus("Initializing ad generation...");
    try {
      console.log('Generating ads with type:', videoAdsEnabled ? 'video_ads' : 'complete_ads');
      
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: videoAdsEnabled ? 'video_ads' : 'complete_ads',
          businessIdea,
          targetAudience,
          campaign: {
            hooks: adHooks,
            specs: videoAdsEnabled ? getVideoAdSpecs() : getImageAdSpecs()
          },
          regenerationCount: regenerationCount,
          timestamp: new Date().getTime()
        }
      });

      if (error) {
        console.error('Error from Edge Function:', error);
        setGenerationStatus("Generation failed. Please try again.");
        throw error;
      }

      console.log('Edge Function response:', data);

      const variants = validateResponse(data);
      const processedVariants = variants.map(variant => {
        const platform = variant.platform || 'facebook';
        return {
          ...variant,
          imageUrl: variant.image?.url || variant.imageUrl,
          platform,
          size: platformConfig[platform as keyof typeof platformConfig]
        };
      });

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
        businessIdea={businessIdea}
        targetAudience={targetAudience}
        adHooks={adHooks}
      />
    </TabsContent>
  );

  return (
    <div className="space-y-6 md:space-y-8">
      <GalleryHeader
        isGenerating={isGenerating}
        generationStatus={generationStatus}
        onBack={onBack}
        onStartOver={onStartOver}
        onRegenerate={generateAds}
      />

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