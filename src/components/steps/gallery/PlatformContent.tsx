import { AdHook } from "@/types/adWizard";
import FacebookAdPreview from "./FacebookAdPreview";
import AdPreviewCard from "./AdPreviewCard";

interface PlatformContentProps {
  platformName: string;
  adVariants: any[];
  onCreateProject: () => void;
  videoAdsEnabled?: boolean;
}

const PlatformContent = ({ platformName, adVariants, onCreateProject, videoAdsEnabled = false }: PlatformContentProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {adVariants
        .filter(variant => variant.platform === platformName)
        .map((variant, index) => (
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