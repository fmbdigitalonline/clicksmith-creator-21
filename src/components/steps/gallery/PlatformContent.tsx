
import { AdHook } from "@/types/adWizard";
import AdPreviewCard from "./components/AdPreviewCard";
import { Loader2 } from "lucide-react";
import { PlatformAdState } from "@/types/adGeneration";

interface PlatformContentProps {
  platformName: string;
  platformState: PlatformAdState;
  onCreateProject: () => void;
  videoAdsEnabled?: boolean;
  selectedFormat?: { width: number; height: number; label: string };
}

const PlatformContent = ({ 
  platformName, 
  platformState,
  onCreateProject,
  videoAdsEnabled = false,
  selectedFormat
}: PlatformContentProps) => {
  if (platformState.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-facebook mb-4" />
        <p className="text-gray-600">Generating {platformName} ads...</p>
      </div>
    );
  }

  if (platformState.hasError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error: {platformState.errorMessage}</p>
        <p className="text-gray-500 mt-2">Please try regenerating the ads.</p>
      </div>
    );
  }

  if (!platformState.variants.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No ad variants available. Please try generating ads.</p>
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
        {platformState.variants.map((variant, index) => (
          <AdPreviewCard
            key={`${platformName}-${variant.id || index}`}
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
