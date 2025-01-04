import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { AdFeedbackControls } from "@/components/steps/gallery/components/AdFeedbackControls";
import MediaPreview from "@/components/steps/gallery/components/MediaPreview";
import AdDetails from "@/components/steps/gallery/components/AdDetails";
import { Skeleton } from "@/components/ui/skeleton";

const Gallery = () => {
  const { data: savedAds, isLoading, error } = useQuery({
    queryKey: ["saved-ads"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("ad_feedback")
        .select("*")
        .eq("user_id", user.id)
        .is("saved_images", "not", null);

      if (error) throw error;
      return data;
    },
  });

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error loading saved ads</h2>
          <p className="text-gray-600 mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Your Saved Ads</h1>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 space-y-4">
              <Skeleton className="h-[300px] w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : savedAds?.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-600">No saved ads yet</h2>
          <p className="text-gray-500 mt-2">Save some ads to see them here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedAds?.map((ad) => (
            <Card key={ad.id} className="overflow-hidden">
              <div className="aspect-video relative group">
                <MediaPreview 
                  imageUrl={Array.isArray(ad.saved_images) && ad.saved_images.length > 0 ? String(ad.saved_images[0]) : null} 
                />
              </div>
              <div className="p-4 space-y-4">
                <AdDetails
                  variant={{
                    headline: "Saved Ad",
                    description: "Your saved advertisement",
                    callToAction: "View Details",
                    size: {
                      width: 1200,
                      height: 628,
                      label: "Facebook Ad"
                    }
                  }}
                />
                <AdFeedbackControls
                  adId={ad.id}
                  projectId={ad.project_id}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;