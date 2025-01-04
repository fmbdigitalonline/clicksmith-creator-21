import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdFeedbackControls } from "../steps/gallery/components/AdFeedbackControls";

interface SavedAd {
  id: string;
  saved_images: any;
  rating: number;
  feedback: string;
  created_at: string;
}

export const SavedAdsGallery = () => {
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSavedAds = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('ad_feedback')
          .select('*')
          .eq('user_id', user.id)
          .not('saved_images', 'is', null)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setSavedAds(data || []);
      } catch (error) {
        console.error('Error fetching saved ads:', error);
        toast({
          title: "Error",
          description: "Failed to load saved ads. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedAds();
  }, [toast]);

  if (isLoading) {
    return <div>Loading saved ads...</div>;
  }

  if (savedAds.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">
          No saved ads yet. Like or favorite ads to see them here!
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {savedAds.map((ad) => (
        <Card key={ad.id} className="overflow-hidden">
          <div className="aspect-video relative">
            {ad.saved_images && ad.saved_images[0] && (
              <img
                src={ad.saved_images[0]}
                alt="Saved ad"
                className="object-cover w-full h-full"
              />
            )}
          </div>
          <CardContent className="p-4">
            <AdFeedbackControls
              adId={ad.id}
              onFeedbackSubmit={() => {
                // Refresh the gallery
                window.location.reload();
              }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};