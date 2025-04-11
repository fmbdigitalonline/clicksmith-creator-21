
import { AdHook } from "@/types/adWizard";
import AdPreviewCard from "./components/AdPreviewCard";
import { TooltipProvider } from "@/components/ui/tooltip";

interface PlatformContentProps {
  platformName: string;
  adVariants: any[];
  onCreateProject: () => void;
  videoAdsEnabled?: boolean;
  selectedFormat?: { width: number; height: number; label: string };
  selectable?: boolean;
  selectedAdIds?: string[];
  onAdSelect?: (id: string, selected: boolean) => void;
  onRegenerateImage?: (variant: any, prompt: string) => Promise<void>;
}

const PlatformContent = ({ 
  platformName, 
  adVariants = [], 
  onCreateProject,
  videoAdsEnabled = false,
  selectedFormat,
  selectable = false,
  selectedAdIds = [],
  onAdSelect,
  onRegenerateImage
}: PlatformContentProps) => {
  // Filter variants by platform and ensure we only show 2 variants per unique image
  const filteredVariants = (() => {
    // First, filter by platform
    const platformVariants = Array.isArray(adVariants) 
      ? adVariants.filter(v => v.platform === platformName)
      : [];

    // Group by image URL to ensure we don't show duplicate images
    const uniqueImages = new Map();
    platformVariants.forEach(variant => {
      const imageUrl = variant.imageUrl || variant.image?.url;
      if (!uniqueImages.has(imageUrl)) {
        uniqueImages.set(imageUrl, []);
      }
      if (uniqueImages.get(imageUrl).length < 2) { // Limit to 2 variants per image
        uniqueImages.get(imageUrl).push(variant);
      }
    });

    // Flatten the map back to an array
    return Array.from(uniqueImages.values()).flat();
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
    <TooltipProvider>
      <div className="space-y-6">
        <p className="text-sm text-gray-600 mb-4">{platformSpecificMessage}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredVariants.map((variant, index) => (
            <AdPreviewCard
              key={`${platformName}-${index}-${variant.imageUrl || variant.image?.url}`}
              variant={variant}
              onCreateProject={onCreateProject}
              isVideo={variant.media_type === 'video' || (videoAdsEnabled && variant.isVideo)}
              selectedFormat={selectedFormat}
              selectable={selectable}
              selected={selectedAdIds.includes(variant.id)}
              onSelect={onAdSelect}
              onRegenerateImage={onRegenerateImage ? 
                (prompt) => onRegenerateImage(variant, prompt) : 
                undefined}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PlatformContent;
