import { AdHook } from "@/types/adWizard";
import FacebookAdPreview from "./FacebookAdPreview";
import AdPreviewCard from "./AdPreviewCard";
import { generateGoogleAds } from "./utils/googleAdsGenerator";

interface PlatformContentProps {
  platformName: string;
  adVariants: any[];
  onCreateProject: () => void;
  videoAdsEnabled?: boolean;
  businessIdea?: any;
  targetAudience?: any;
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
  let filteredVariants = adVariants;

  // Use special handling for Google ads
  if (platformName === 'google' && businessIdea && targetAudience) {
    filteredVariants = generateGoogleAds(businessIdea, targetAudience, adHooks, videoAdsEnabled);
  } else {
    // Keep existing filtering for other platforms
    filteredVariants = Array.isArray(adVariants) 
      ? adVariants.filter(variant => variant.platform === platformName)
      : [];
  }

  if (filteredVariants.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Generating {platformName} ads... Please wait or try regenerating the ads.</p>
      </div>
    );
  }

  const renderAdPreview = (variant: any, index: number) => {
    if (platformName === 'facebook') {
      return (
        <FacebookAdPreview
          key={`${index}-${variant.size?.label || 'default'}`}
          variant={variant}
          onCreateProject={onCreateProject}
          isVideo={videoAdsEnabled}
        />
      );
    }

    return (
      <AdPreviewCard
        key={`${index}-${variant.size?.label || 'default'}`}
        variant={variant}
        onCreateProject={onCreateProject}
        isVideo={videoAdsEnabled}
      />
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {filteredVariants.map((variant, index) => renderAdPreview(variant, index))}
    </div>
  );
};

export default PlatformContent;
