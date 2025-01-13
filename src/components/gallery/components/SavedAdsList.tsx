import { SavedAdCard } from "./SavedAdCard";
import { SavedAd } from "../types";

interface SavedAdsListProps {
  ads: SavedAd[];
  onFeedbackSubmit: () => void;
}

export const SavedAdsList = ({ ads, onFeedbackSubmit }: SavedAdsListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ads.map((ad) => (
        <SavedAdCard
          key={ad.id}
          id={ad.id}
          primaryText={ad.primary_text}
          headline={ad.headline}
          imageUrl={ad.saved_images[0]}
          onFeedbackSubmit={onFeedbackSubmit}
        />
      ))}
    </div>
  );
};