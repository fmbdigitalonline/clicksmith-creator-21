import { AdHook } from "@/types/adWizard";
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
  // Filter variants for the current platform
  const platformVariants = adVariants.filter(variant => 
    variant.platform === platformName || 
    (!variant.platform && platformName === 'facebook') // Default to facebook if no platform specified
  );

  if (platformVariants.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No ads generated for {platformName} yet. Try regenerating the ads.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {platformVariants.map((variant, index) => (
        <AdPreviewCard
          key={`${platformName}-${index}`}
          variant={variant}
          onCreateProject={onCreateProject}
          isVideo={videoAdsEnabled}
        />
      ))}
    </div>
  );
};

export default PlatformContent;