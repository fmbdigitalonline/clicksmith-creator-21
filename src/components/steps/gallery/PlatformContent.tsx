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
  adVariants = [], // Add default empty array
  onCreateProject, 
  videoAdsEnabled = false 
}: PlatformContentProps) => {
  // Ensure adVariants is an array before filtering
  const filteredVariants = Array.isArray(adVariants) 
    ? adVariants.filter(variant => variant.platform === platformName)
    : [];

  if (filteredVariants.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No ad variants available for {platformName}. Please try regenerating the ads.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {filteredVariants.map((variant, index) => (
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