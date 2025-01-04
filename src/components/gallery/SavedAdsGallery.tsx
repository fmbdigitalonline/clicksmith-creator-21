import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdCard } from "./components/AdCard";
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

        if (error) throw error;

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
        <AdCard
          key={ad.id}
          id={ad.id}
          primaryText={ad.primary_text}
          headline={ad.headline}
          imageUrl={ad.saved_images[0]}
          onFeedbackSubmit={() => window.location.reload()}
        />
      ))}
    </div>
  );
};