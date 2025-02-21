
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
  // Filter variants by platform but preserve all variants for image selection
  const filteredVariants = (() => {
    // Filter by platform
    const platformVariants = Array.isArray(adVariants) 
      ? adVariants.filter(v => v.platform === platformName)
      : [];

    // Group by image URL to ensure we don't show duplicate images
    const uniqueImages = new Map();
    platformVariants.forEach(variant => {
      const imageUrl = variant.imageUrl || variant.image?.url;
      if (!uniqueImages.has(imageUrl)) {
        uniqueImages.set(imageUrl, variant); // Store the full variant
      }
    });

    return Array.from(uniqueImages.values());
  })();

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
            key={`${platformName}-${index}-${variant.imageUrl || variant.image?.url}`}
            variant={variant}
            adVariants={adVariants}
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
