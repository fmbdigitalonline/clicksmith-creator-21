
import { AdHook } from "@/types/adWizard";
import AdPreviewCard from "./components/AdPreviewCard";

interface PlatformContentProps {
  platformName: string;
  adVariants: any[];
  onCreateProject: () => void;
  videoAdsEnabled?: boolean;
  selectedFormat?: { width: number; height: number; label: string };
}

const PlatformContent = ({ 
  platformName, 
  adVariants = [], 
  onCreateProject,
  videoAdsEnabled = false,
  selectedFormat
}: PlatformContentProps) => {
  // Filter variants by platform and limit to 2 variants per image set
  const getFilteredVariants = () => {
    const platformVariants = adVariants.filter(v => v.platform === platformName);
    const variantsByImageSet = new Map();
    const result = [];

    // Group variants by imageSet and take only 2 per set
    platformVariants.forEach(variant => {
      const imageSet = variant.imageSet || 1;
      if (!variantsByImageSet.has(imageSet)) {
        variantsByImageSet.set(imageSet, []);
      }
      const currentSet = variantsByImageSet.get(imageSet);
      if (currentSet.length < 2) {
        currentSet.push(variant);
      }
    });

    // Flatten the map values into a single array
    variantsByImageSet.forEach(variants => {
      result.push(...variants);
    });

    return result;
  };

  const filteredVariants = getFilteredVariants();

  if (filteredVariants.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No ad variants available. Please try regenerating the ads.</p>
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
            key={`${variant.id || index}-${variant.imageSet}-${variant.size?.label || 'default'}`}
            variant={variant}
            onCreateProject={onCreateProject}
            isVideo={videoAdsEnabled}
            selectedFormat={selectedFormat}
          />
        ))}
      </div>
    </div>
  );
};

export default PlatformContent;
