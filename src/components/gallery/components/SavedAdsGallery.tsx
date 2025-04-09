
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { EmptyState } from "@/components/gallery/components/EmptyState";
import { useTranslation } from "react-i18next";
import { SavedAdCard } from "@/components/gallery/components/SavedAdCard";
import { Loader2 } from "lucide-react";

interface SavedAd {
  id: string;
  headline?: string;
  primary_text?: string;
  rating: number;
  feedback: string;
  created_at: string;
  imageurl?: string;
  storage_url?: string;
  image_status?: 'pending' | 'processing' | 'ready' | 'failed';
  platform?: string;
  size?: {
    width: number;
    height: number;
    label: string;
  };
  project_id?: string;
}

interface AdFeedbackRow {
  id: string;
  headline?: string;
  primary_text?: string;
  rating: number;
  feedback: string;
  created_at: string;
  imageurl?: string;
  storage_url?: string;
  image_status?: string;
  platform?: string;
  size?: Json;
  project_id?: string;
}

interface SavedAdsGalleryProps {
  projectFilter?: string;
}

export const SavedAdsGallery = ({ projectFilter }: SavedAdsGalleryProps = {}) => {
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation(["gallery", "common", "dashboard"]);

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
        .select('id, headline, primary_text, rating, feedback, created_at, imageurl, storage_url, image_status, platform, size, project_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (projectFilter) {
        query = query.eq('project_id', projectFilter);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      console.log('Retrieved ads count:', data?.length);

      const uniqueImageUrls = new Set();
      const uniqueAds = (data as AdFeedbackRow[] || []).filter(ad => {
        if (!ad.imageurl) {
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

      const convertedAds: SavedAd[] = uniqueAds.map(ad => ({
        ...ad,
        size: ad.size as { width: number; height: number; label: string },
        image_status: ad.image_status as 'pending' | 'processing' | 'ready' | 'failed'
      }));

      setSavedAds(convertedAds);
    } catch (error) {
      console.error('Error fetching saved ads:', error);
      toast({
        title: t("error", { ns: "common" }),
        description: t("load_error", { ns: "gallery" }),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedAds();
  }, [toast, projectFilter, t]);

  const handleRegenerateImage = async (adId: string, prompt?: string) => {
    setIsRegenerating(adId);
    try {
      const { data: adData, error: adError } = await supabase
        .from('ad_feedback')
        .select('*')
        .eq('id', adId)
        .single();
      
      if (adError) throw adError;
      
      if (prompt) {
        const regenerationPrompt = prompt || adData.primary_text || "Professional marketing image for advertisement";
        
        const { data, error } = await supabase.functions.invoke('generate-images', {
          body: { 
            prompt: regenerationPrompt,
            adId: adId
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Image regeneration started",
          description: "Your new image is being generated. This may take a moment."
        });
      }
      
      await fetchSavedAds();
      
    } catch (error) {
      console.error('Error regenerating image:', error);
      toast({
        title: "Regeneration failed",
        description: "Could not regenerate the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>{t("loading.saved_ads", { ns: "dashboard" })}</span>
      </div>
    );
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
          imageUrl={ad.imageurl}
          storage_url={ad.storage_url}
          image_status={ad.image_status}
          platform={ad.platform}
          size={ad.size}
          projectId={ad.project_id}
          onFeedbackSubmit={fetchSavedAds}
          onRegenerateImage={handleRegenerateImage}
        />
      ))}
    </div>
  );
};
