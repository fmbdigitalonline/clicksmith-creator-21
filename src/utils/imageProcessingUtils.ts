
import { supabase } from "@/integrations/supabase/client";
import { SavedAd } from "@/types/savedAd";

/**
 * Processes an image for Facebook ads, ensuring it's stored in Supabase Storage
 * @param adId The ID of the ad to process
 * @returns A promise resolving to the processing result
 */
export async function processImageForAd(adId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('migrate-images', {
      body: { adId }
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

/**
 * Processes images for a batch of ads 
 * @param batchSize Number of ads to process in batch (default: 10)
 * @returns Processing results
 */
export async function processPendingImages(batchSize = 10) {
  try {
    const { data, error } = await supabase.functions.invoke('migrate-images', {
      body: { 
        batchProcess: true,
        batchSize
      }
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error processing images in batch:', error);
    throw error;
  }
}

/**
 * Gets the current image status for an ad
 * @param adId The ID of the ad
 * @returns The current image status and URLs
 */
export async function getImageStatus(adId: string) {
  try {
    const { data, error } = await supabase
      .from('ad_feedback')
      .select('image_status, storage_url, original_url, imageUrl, imageurl')
      .eq('id', adId)
      .single();

    if (error) throw error;

    return {
      status: data.image_status || 'pending',
      storageUrl: data.storage_url,
      originalUrl: data.original_url || data.imageUrl || data.imageurl,
    };
  } catch (error) {
    console.error('Error getting image status:', error);
    throw error;
  }
}

/**
 * Checks if a URL is publicly accessible
 * @param url The URL to check
 * @returns Whether the URL is publicly accessible
 */
export async function isImageUrlAccessible(url: string): Promise<boolean> {
  if (!url) return false;
  
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    return response.ok;
  } catch (error) {
    console.error('Error checking image accessibility:', error);
    return false;
  }
}

/**
 * Gets the best available URL for an ad image
 * Prefers storage_url if available, falls back to imageUrl/imageurl
 * @param ad The ad object
 * @returns The best available URL
 */
export function getBestImageUrl(ad: SavedAd): string | undefined {
  return ad.storage_url || ad.imageUrl || ad.imageurl;
}
