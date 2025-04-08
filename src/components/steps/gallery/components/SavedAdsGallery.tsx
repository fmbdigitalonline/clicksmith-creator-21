
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdFeedbackControls } from "@/components/steps/gallery/components/AdFeedbackControls";
import { Json } from "@/integrations/supabase/types";
import { EmptyState } from "@/components/gallery/components/EmptyState";
import { useTranslation } from "react-i18next";
import { AdCard } from "@/components/gallery/components/AdCard";

interface SavedAd {
  id: string;
  headline?: string;
  primary_text?: string;
  rating: number;
  feedback: string;
  created_at: string;
  imageurl?: string;
  platform?: string;
  size?: {
    width: number;
    height: number;
    label: string;
  };
}

interface AdFeedbackRow {
  id: string;
  headline?: string;
  primary_text?: string;
  rating: number;
  feedback: string;
  created_at: string;
  imageurl?: string;
  platform?: string;
  size?: Json;
}

interface SavedAdsGalleryProps {
  projectFilter?: string;
}

export const SavedAdsGallery = ({ projectFilter }: SavedAdsGalleryProps = {}) => {
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation(["gallery", "common", "dashboard"]);

  useEffect(() => {
    const fetchSavedAds = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        console.log('Fetching saved ads for user:', user.id, projectFilter ? `with project filter: ${projectFilter}` : 'without project filter');

        let query = supabase
          .from('ad_feedback')
          .select('id, headline, primary_text, rating, feedback, created_at, imageurl, platform, size')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        // Apply project filter if provided
        if (projectFilter) {
          query = query.eq('project_id', projectFilter);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        console.log('Retrieved ads count:', data?.length);

        // Deduplicate ads by imageurl
        const uniqueImageUrls = new Set();
        const uniqueAds = (data as AdFeedbackRow[] || []).filter(ad => {
          if (!ad.imageurl || uniqueImageUrls.has(ad.imageurl)) {
            return false;
          }
          uniqueImageUrls.add(ad.imageurl);
          return true;
        });

        console.log('Unique ads count:', uniqueAds.length);

        // Convert the data to match SavedAd interface
        const convertedAds: SavedAd[] = uniqueAds.map(ad => ({
          ...ad,
          size: ad.size as { width: number; height: number; label: string }
        }));

        setSavedAds(convertedAds);
      } catch (error) {
        console.error('Error fetching saved ads:', error);
        toast({
          title: t("error", { ns: "common" }),
          description: t("load_error"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedAds();
  }, [toast, projectFilter, t]);

  if (isLoading) {
    return <div>{t("loading.saved_ads", { ns: "dashboard" })}</div>;
  }

  if (savedAds.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {savedAds.map((ad) => (
        <AdCard 
          key={ad.id}
          id={ad.id}
          primaryText={ad.primary_text}
          headline={ad.headline}
          imageUrl={ad.imageurl}
          onFeedbackSubmit={() => {
            window.location.reload();
          }}
        />
      ))}
    </div>
  );
};
