
import { EnhancedSavedAdsGallery } from "./EnhancedSavedAdsGallery";

interface SavedAdsGalleryProps {
  projectFilter?: string;
}

export const SavedAdsGallery = ({ projectFilter }: SavedAdsGalleryProps) => {
  return <EnhancedSavedAdsGallery projectFilter={projectFilter} />;
};
