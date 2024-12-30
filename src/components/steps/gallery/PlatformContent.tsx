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
  const filteredVariants = Array.isArray(adVariants) 
    ? adVariants.filter(variant => variant.platform === platformName)
    : [];

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