
import { supabase } from "@/integrations/supabase/client";

/**
 * Process an image for Facebook ads
 * @param adId The ID of the ad to process
 * @returns Object with processing result
 */
export const processImageForFacebook = async (adId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('migrate-images', {
      body: { adId }
    });

    if (error) throw error;

    if (!data || !data.processed || data.processed.length === 0) {
      throw new Error('No processing result returned');
    }

    const result = data.processed[0];
    if (!result.success) {
      throw new Error(result.error || 'Failed to process image');
    }

    return result;
  } catch (error) {
    console.error('Error processing image for Facebook:', error);
    throw error;
  }
};

/**
 * Check the status of image processing
 * @param adId The ID of the ad to check
 * @returns Object with current image status
 */
export const checkImageStatus = async (adId: string) => {
  try {
    const { data, error } = await supabase
      .from('ad_feedback')
      .select('image_status, storage_url, original_url')
      .eq('id', adId)
      .single();

    if (error) throw error;

    return {
      status: data?.image_status || 'pending',
      storageUrl: data?.storage_url,
      originalUrl: data?.original_url || data?.imageUrl
    };
  } catch (error) {
    console.error('Error checking image status:', error);
    throw error;
  }
};

/**
 * Process a batch of images for Facebook ads
 * @param batchSize Number of images to process
 * @returns Object with processing results
 */
export const processBatchForFacebook = async (batchSize = 10) => {
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
    console.error('Error processing batch for Facebook:', error);
    throw error;
  }
};

/**
 * Upload an image to Supabase Storage and update ad_feedback
 * @param file The file to upload
 * @param adId The ID of the ad to update
 * @returns Object with upload result
 */
export const uploadAndProcessImage = async (file: File, adId: string) => {
  try {
    // First, upload the file to Supabase Storage
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Generate a unique path including userId and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const userId = user.id;
    const fileName = `${userId}/${timestamp}-${file.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ad-images')
      .upload(fileName, file, {
        cacheControl: '3600',
      });
      
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('ad-images')
      .getPublicUrl(fileName);
      
    // Update the ad_feedback record
    const { data: updateData, error: updateError } = await supabase
      .from('ad_feedback')
      .update({
        storage_url: publicUrl,
        imageUrl: publicUrl,
        imageurl: publicUrl,
        image_status: 'ready'
      })
      .eq('id', adId)
      .select()
      .single();
      
    if (updateError) throw updateError;
    
    return {
      success: true,
      publicUrl,
      adData: updateData
    };
  } catch (error) {
    console.error('Error uploading and processing image:', error);
    throw error;
  }
};
