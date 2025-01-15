import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import AdPreviewCard from "./components/AdPreviewCard";

interface PlatformContentProps {
  platformName: string;
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  adHooks: AdHook[];
  onCreateProject: () => void;
  generatedAds: any[];
}

const PlatformContent = ({ 
  platformName, 
  businessIdea,
  targetAudience,
  adHooks,
  onCreateProject,
  generatedAds = []
}: PlatformContentProps) => {
  const filteredVariants = Array.isArray(generatedAds) 
    ? generatedAds.filter(variant => variant.platform === platformName)
    : [];

  if (filteredVariants.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No ad variants available for {platformName}. Please try regenerating the ads.</p>
      </div>
    );
  }

  const platformSpecificMessage = {
    facebook: "Perfect for Facebook Feed, Stories, and Instagram",
    google: "Optimized for Google Display Network and YouTube",
    linkedin: "Professional format for LinkedIn Feed and Sponsored Content",
    tiktok: "Engaging format for TikTok For Business"
  }[platformName] || "";

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 mb-4">{platformSpecificMessage}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVariants.map((variant, index) => (
          <AdPreviewCard
            key={`${platformName}-${index}-${variant.size?.label || 'default'}`}
            variant={variant}
            onCreateProject={onCreateProject}
          />
        ))}
      </div>
    </div>
  );
};

export default PlatformContent;