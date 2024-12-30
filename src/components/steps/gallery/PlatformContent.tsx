import { AdHook, BusinessIdea, TargetAudience } from "@/types/adWizard";
import FacebookAdPreview from "./FacebookAdPreview";
import AdPreviewCard from "./AdPreviewCard";
import { useEffect, useState } from "react";
import { generateGoogleAds } from "@/utils/googleAdsGenerator";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface PlatformContentProps {
  platformName: string;
  adVariants: any[];
  onCreateProject: () => void;
  videoAdsEnabled?: boolean;
  businessIdea?: BusinessIdea;
  targetAudience?: TargetAudience;
  adHooks?: AdHook[];
}

const PlatformContent = ({ 
  platformName, 
  adVariants = [],
  onCreateProject, 
  videoAdsEnabled = false,
  businessIdea,
  targetAudience,
  adHooks = []
}: PlatformContentProps) => {
  const [googleAds, setGoogleAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadGoogleAds = async () => {
      if (platformName === 'google' && businessIdea && targetAudience) {
        setIsLoading(true);
        try {
          // Get the first available image URL from Facebook ads
          const existingImageUrl = adVariants[0]?.imageUrl || adVariants[0]?.image?.url;
          
          const ads = await generateGoogleAds(
            businessIdea,
            targetAudience,
            adHooks,
            videoAdsEnabled,
            existingImageUrl // Pass the existing image URL
          );
          
          // Ensure each Google ad variant uses the existing image
          const processedAds = ads.map(ad => ({
            ...ad,
            image: {
              url: existingImageUrl,
              prompt: "Existing image from Facebook ad"
            },
            imageUrl: existingImageUrl // Add this for compatibility
          }));
          
          setGoogleAds(processedAds);
        } catch (error) {
          console.error('Error loading Google ads:', error);
          toast({
            title: "Error generating Google Ads",
            description: "Failed to generate Google ad variants. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (platformName === 'google') {
      loadGoogleAds();
    }
  }, [platformName, businessIdea, targetAudience, adHooks, videoAdsEnabled, adVariants]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-facebook" />
      </div>
    );
  }

  const displayAds = platformName === 'google' ? googleAds : adVariants.filter(variant => variant.platform === platformName);

  if (displayAds.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No ad variants available for {platformName}. Please try regenerating the ads.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {displayAds.map((variant, index) => (
        platformName === 'facebook' ? (
          <FacebookAdPreview
            key={`${index}-${variant.size?.label || 'default'}`}
            variant={variant}
            onCreateProject={onCreateProject}
            isVideo={videoAdsEnabled}
          />
        ) : (
          <AdPreviewCard
            key={`${index}-${variant.size?.label || 'default'}`}
            variant={variant}
            onCreateProject={onCreateProject}
            isVideo={videoAdsEnabled}
          />
        )
      ))}
    </div>
  );
};

export default PlatformContent;