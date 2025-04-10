
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAdPersistence = (projectId: string | undefined) => {
  const [savedAds, setSavedAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSavedAds();
  }, [projectId]);

  const loadSavedAds = async () => {
    if (!projectId || projectId === 'new') return;
    
    setIsLoading(true);
    try {
      const { data: project } = await supabase
        .from('projects')
        .select('generated_ads')
        .eq('id', projectId)
        .single();
      
      if (project?.generated_ads && Array.isArray(project.generated_ads)) {
        // Create a map using image URL as key to ensure uniqueness
        const uniqueAdsMap = new Map();
        
        project.generated_ads.forEach((ad: any) => {
          const imageKey = ad.imageUrl || ad.imageurl || (ad.saved_images && ad.saved_images[0]);
          if (imageKey && !uniqueAdsMap.has(imageKey)) {
            uniqueAdsMap.set(imageKey, ad);
          }
        });
        
        // Convert back to array
        const uniqueAds = Array.from(uniqueAdsMap.values());
        setSavedAds(uniqueAds);
      }
    } catch (error) {
      console.error('Error loading saved ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processImagesForFacebook = async (ads: any[]) => {
    try {
      // Call the edge function with all ad IDs for batch processing
      const { data, error } = await supabase.functions.invoke('migrate-images', {
        body: { adIds: ads.map(ad => ad.id) }
      });
      
      if (error) throw error;

      if (data?.processed) {
        // Update storage URLs in local state if immediately available
        const processedIds = new Set(data.processed.map((p: any) => p.adId));
        setSavedAds(prev => prev.map(ad => {
          if (processedIds.has(ad.id)) {
            const processedData = data.processed.find((p: any) => p.adId === ad.id);
            return {
              ...ad,
              storage_url: processedData?.storage_url || ad.storage_url,
              image_status: processedData?.success ? 'processing' : 'failed'
            };
          }
          return ad;
        }));

        toast({
          title: "Image Processing Started",
          description: "Your images are being processed for Facebook ads. This may take a moment.",
        });
      }
    } catch (error) {
      console.error('Error processing images:', error);
      toast({
        title: "Processing Error",
        description: "Failed to start image processing. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const saveGeneratedAds = async (newAds: any[]) => {
    if (!projectId || projectId === 'new') return;

    try {
      // Create a Map to store unique ads by image URL for better deduplication
      const uniqueAdsMap = new Map();
      
      // First add existing ads to the map using image URL as key
      savedAds.forEach(ad => {
        const imageKey = ad.imageUrl || ad.imageurl || (ad.saved_images && ad.saved_images[0]);
        if (imageKey) {
          uniqueAdsMap.set(imageKey, ad);
        } else {
          // If no image key found, use ID as fallback (should be rare)
          uniqueAdsMap.set(ad.id, ad);
        }
      });
      
      // Then add new ads, overwriting any duplicates based on image URL
      newAds.forEach(ad => {
        const imageKey = ad.imageUrl || ad.imageurl || (ad.saved_images && ad.saved_images[0]);
        if (imageKey) {
          uniqueAdsMap.set(imageKey, ad);
        } else {
          // If no image key found, use ID as fallback (should be rare)
          uniqueAdsMap.set(ad.id, ad);
        }
      });
      
      // Convert map back to array
      const updatedAds = Array.from(uniqueAdsMap.values());

      const { error: updateError } = await supabase
        .from('projects')
        .update({ generated_ads: updatedAds })
        .eq('id', projectId);

      if (updateError) throw updateError;
      
      setSavedAds(updatedAds);

      // Start processing images for Facebook automatically
      await processImagesForFacebook(newAds);
      
      toast({
        title: "Ads Saved",
        description: "Your ads have been saved to the project and image processing has started.",
      });
    } catch (error) {
      console.error('Error saving generated ads:', error);
      toast({
        title: "Error",
        description: "Failed to save ads. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    savedAds,
    isLoading,
    saveGeneratedAds
  };
};
