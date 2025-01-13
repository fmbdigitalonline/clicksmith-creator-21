import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { SavedAdCard } from "./components/SavedAdCard";
import { EmptyState } from "./components/EmptyState";

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

  useEffect(() => {
    let isMounted = true;

    const loadAds = async () => {
      if (isMounted) {
        await fetchSavedAds();
      }
    };

    loadAds();

    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, [toast]);

  if (isLoading) {
    return <div>Loading saved ads...</div>;
  }

  if (savedAds.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {savedAds.map((ad) => (
        <SavedAdCard
          key={ad.id}
          id={ad.id}
          primaryText={ad.primary_text}
          headline={ad.headline}
          imageUrl={ad.saved_images[0]}
          onFeedbackSubmit={fetchSavedAds}
        />
      ))}
    </div>
  );
};