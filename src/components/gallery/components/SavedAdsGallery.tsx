import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdFeedbackControls } from "@/components/steps/gallery/components/AdFeedbackControls";
import { Json } from "@/integrations/supabase/types";
import { EmptyState } from "@/components/gallery/components/EmptyState";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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

        // Deduplicate ads by imageurl but check for null imageurl values
        const uniqueImageUrls = new Set();
        const uniqueAds = (data as AdFeedbackRow[] || []).filter(ad => {
          if (!ad.imageurl) {
            // If no imageurl, use the ad id as a fallback key
            if (uniqueImageUrls.has(ad.id)) {
              return false;
            }
            uniqueImageUrls.add(ad.id);
            return true;
          }
          
          if (uniqueImageUrls.has(ad.imageurl)) {
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
          title: t("errors.title", "Error"),
          description: t("gallery.load_error", "Failed to load saved ads. Please try again."),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedAds();
  }, [toast, projectFilter, t]);

  if (isLoading) {
    return <div>{t("loading.saved_ads", "Loading saved ads...")}</div>;
  }

  if (savedAds.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {savedAds.map((ad) => (
        <Card key={ad.id} className="overflow-hidden">
          {/* Primary Text Section */}
          {ad.primary_text && (
            <CardContent className="p-4 border-b">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">{t("gallery.primary_text", "Primary Text")}</p>
                <p className="text-gray-800 whitespace-pre-wrap">{ad.primary_text}</p>
              </div>
            </CardContent>
          )}
          
          {/* Image Section */}
          {ad.imageurl && (
            <div className="aspect-video relative">
              <img
                src={ad.imageurl}
                alt={t("gallery.ad_creative_alt", "Ad creative")}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          {/* Headline Section */}
          {ad.headline && (
            <CardContent className="p-4 border-t">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">{t("gallery.headline", "Headline")}</p>
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
