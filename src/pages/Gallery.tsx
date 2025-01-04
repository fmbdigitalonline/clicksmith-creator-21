import { SavedAdsGallery } from "@/components/gallery/SavedAdsGallery";

const Gallery = () => {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Saved Ads</h1>
      <SavedAdsGallery />
    </div>
  );
};

export default Gallery;