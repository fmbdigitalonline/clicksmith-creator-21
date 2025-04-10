
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { EmptyState } from "@/components/gallery/components/EmptyState";
import { useTranslation } from "react-i18next";
import { SavedAdCard } from "@/components/gallery/components/SavedAdCard";
import { Loader2, FileVideo, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadMedia, MediaUploadResult } from "@/utils/uploadUtils";
import MediaPreview from "@/components/steps/gallery/components/MediaPreview";

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
  file_type?: string;
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
  file_type?: string;
}

interface SavedAdsGalleryProps {
  projectFilter?: string;
}

export const SavedAdsGallery = ({ projectFilter }: SavedAdsGalleryProps = {}) => {
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
        .select('id, headline, primary_text, rating, feedback, created_at, imageurl, storage_url, image_status, platform, size, project_id, media_type, file_type')
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

      // Add runtime type checking and safe casting
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response format from database");
      }
      
      // Use explicit type assertion with filtering for safety
      const adFeedbackRows = data.filter((item): item is AdFeedbackRow => {
        return typeof item === 'object' && item !== null && 'id' in item && 
               'rating' in item && 'feedback' in item && 'created_at' in item;
      });

      const uniqueImageUrls = new Set();
      const uniqueAds = adFeedbackRows.filter(ad => {
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
        image_status: ad.image_status as 'pending' | 'processing' | 'ready' | 'failed',
        media_type: ad.media_type as 'image' | 'video'
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User must be logged in to upload videos");
      }

      // Upload the video file
      const mediaData = await uploadMedia(file, 'ad-videos');
      
      // Create a new ad entry with the video
      const { data, error } = await supabase
        .from('ad_feedback')
        .insert({
          user_id: user.id,
          project_id: projectFilter,
          saved_images: [mediaData.url],
          primary_text: "Video advertisement",
          headline: file.name.split('.')[0] || "Video Ad",
          imageurl: mediaData.url,
          storage_url: mediaData.url,
          media_type: 'video',
          file_type: mediaData.fileType,
          image_status: 'ready',
          feedback: 'saved',
          platform: 'facebook',
          size: { width: 1200, height: 628, label: "Facebook Feed" }
        })
        .select();

      if (error) throw error;
      
      toast({
        title: "Video uploaded",
        description: "Your video has been uploaded successfully and added to your gallery."
      });
      
      // Refresh the gallery
      await fetchSavedAds();
      
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
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

  return (
    <div className="space-y-6">
      {/* Upload video button at the top */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={() => document.getElementById('gallery-video-upload')?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("uploading")}
            </>
          ) : (
            <>
              <FileVideo className="mr-2 h-4 w-4" />
              {t("upload_video", "Upload Video")}
            </>
          )}
        </Button>
        <input
          id="gallery-video-upload"
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={handleVideoUpload}
        />
      </div>

      {savedAds.length === 0 ? (
        <EmptyState />
      ) : (
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
      )}
    </div>
  );
};
