import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdFeedbackControls } from "@/components/steps/gallery/components/AdFeedbackControls";
import { Json } from "@/integrations/supabase/types";

interface SavedAd {
  id: string;
  saved_images: string[];
  headline?: string;
  primary_text?: string;
  rating: number;
  feedback: string;
  created_at: string;
}

interface AdFeedbackRow {
  id: string;
  saved_images: Json;
  headline?: string;
  primary_text?: string;
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

        if (error) {
          throw error;
        }

        // Convert the data to match SavedAd interface
        const convertedAds: SavedAd[] = (data as AdFeedbackRow[]).map(ad => ({
          ...ad,
          saved_images: Array.isArray(ad.saved_images) 
            ? (ad.saved_images as string[])
            : typeof ad.saved_images === 'string'
              ? [ad.saved_images as string]
              : []
        }));

        setSavedAds(convertedAds);
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
          {/* Primary Text Section */}
          {ad.primary_text && (
            <CardContent className="p-4 border-b">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Primary Text</p>
                <p className="text-gray-800 whitespace-pre-wrap">{ad.primary_text}</p>
              </div>
            </CardContent>
          )}
          
          {/* Image Section */}
          {ad.saved_images && ad.saved_images[0] && (
            <div className="aspect-video relative">
              <img
                src={ad.saved_images[0]}
                alt="Ad creative"
                className="object-cover w-full h-full"
              />
            </div>
          )}

          {/* Headline Section */}
          {ad.headline && (
            <CardContent className="p-4 border-t">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Headline</p>
                <h3 className="text-lg font-semibold text-facebook">{ad.headline}</h3>
              </div>
            </CardContent>
          )}

          {/* Feedback Controls */}
          <CardContent className="p-4 border-t bg-gray-50">
            <AdFeedbackControls
              adId={ad.id}
              onFeedbackSubmit={() => {
                window.location.reload();
              }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};