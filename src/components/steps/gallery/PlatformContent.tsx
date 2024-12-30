import { AdHook } from "@/types/adWizard";
import FacebookAdPreview from "./FacebookAdPreview";
import AdPreviewCard from "./AdPreviewCard";

interface PlatformContentProps {
  platformName: string;
  adVariants: any[];
  onCreateProject: () => void;
  videoAdsEnabled?: boolean;
}

const PlatformContent = ({ 
  platformName, 
  adVariants = [], 
  onCreateProject, 
  videoAdsEnabled = false 
}: PlatformContentProps) => {
  // Ensure adVariants is an array before filtering
  const filteredVariants = Array.isArray(adVariants) ? adVariants : [];

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

  // Add resizing options for all platforms
  const resizingOptions = {
    facebook: [
      { width: 1200, height: 628, label: "Feed (1.91:1)" },
      { width: 1080, height: 1080, label: "Square (1:1)" },
      { width: 1080, height: 1920, label: "Story (9:16)" }
    ],
    google: [
      { width: 1200, height: 628, label: "Display (1.91:1)" },
      { width: 1200, height: 1200, label: "Square (1:1)" },
      { width: 1200, height: 1500, label: "Portrait (4:5)" }
    ],
    linkedin: [
      { width: 1200, height: 627, label: "Feed (1.91:1)" },
      { width: 1080, height: 1080, label: "Square (1:1)" },
      { width: 1080, height: 1920, label: "Story (9:16)" }
    ],
    tiktok: [
      { width: 1080, height: 1920, label: "Full Screen (9:16)" },
      { width: 1080, height: 1080, label: "Square (1:1)" },
      { width: 1200, height: 628, label: "Feed (1.91:1)" }
    ]
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 mb-4">{platformSpecificMessage}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVariants.map((variant, index) => (
          <AdPreviewCard
            key={`${index}-${variant.size?.label || 'default'}`}
            variant={variant}
            onCreateProject={onCreateProject}
            isVideo={videoAdsEnabled}
            resizingOptions={resizingOptions[platformName as keyof typeof resizingOptions] || []}
          />
        ))}
      </div>
    </div>
  );
};

export default PlatformContent;