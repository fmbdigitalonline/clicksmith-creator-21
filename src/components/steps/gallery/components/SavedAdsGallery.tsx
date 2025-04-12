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
  media_type?: 'image' | 'video';
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
  media_type?: string;
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
        .select('id, headline, primary_text, rating, feedback, created_at, imageurl, storage_url, image_status, platform, size, project_id, media_type')
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

      const responseData = Array.isArray(data) ? (data as AdFeedbackRow[]) : [];

      const uniqueImageUrls = new Set();
      const uniqueAds = responseData.filter(ad => {
        if (!ad.imageurl && !ad.storage_url) {
          if (uniqueImageUrls.has(ad.id)) {
            return false;
          }
          uniqueImageUrls.add(ad.id);
          return true;
        }
        
        const imageKey = ad.storage_url || ad.imageurl;
        if (uniqueImageUrls.has(imageKey)) {
          return false;
        }
        
        uniqueImageUrls.add(imageKey);
        return true;
      });

      console.log('Unique ads count:', uniqueAds.length);

      const convertedAds: SavedAd[] = uniqueAds.map(ad => {
        let sizeObj = { width: 1080, height: 1080, label: "Square" };
        if (ad.size) {
          if (typeof ad.size === 'object' && ad.size !== null && !Array.isArray(ad.size)) {
            const sizeData = ad.size as Record<string, Json>;
            
            const width = sizeData.width;
            if (typeof width === 'number') {
              sizeObj.width = width;
            }
            
            const height = sizeData.height;
            if (typeof height === 'number') {
              sizeObj.height = height;
            }
            
            const label = sizeData.label;
            if (typeof label === 'string') {
              sizeObj.label = label;
            }
          }
        }
        
        return {
          ...ad,
          size: sizeObj,
          image_status: ad.image_status as 'pending' | 'processing' | 'ready' | 'failed',
          media_type: (ad.media_type || 'image') as 'image' | 'video'
        };
      });

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

      if (adData.media_type === 'video') {
        toast({
          title: "Video replacement",
          description: "To replace a video, please upload a new one directly."
        });
        setIsRegenerating(null);
        return;
      }
      
      if (prompt || adData.primary_text) {
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
      <div className="flex justify-center items-center py-8 md:py-12">
        <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary mr-2" />
        <span className="text-sm md:text-base">{t("loading.saved_ads", { ns: "dashboard" })}</span>
      </div>
    );
  }

  if (savedAds.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
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
          media_type={ad.media_type}
          selectable={false}
        />
      ))}
    </div>
  );
};
