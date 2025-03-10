
import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads an image to Supabase storage
 * @param file The file to upload
 * @param path The path to store the file in
 * @returns The URL of the uploaded file
 */
export const uploadMedia = async (file: File, path: string = 'media') => {
  try {
    // Generate a unique filename
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const fileExtension = file.name.split('.').pop();
    const filePath = `${path}/${fileName}.${fileExtension}`;
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('ad-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('ad-images')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
};

/**
 * Checks the status of an image in the database
 * @param adId ID of the ad to check
 * @returns Object containing status info
 */
export const checkImageStatus = async (adId: string) => {
  try {
    const { data, error } = await supabase
      .from('ad_feedback')
      .select('image_status, storage_url, original_url, imageUrl')
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
    return {
      status: 'error',
      storageUrl: null,
      originalUrl: null
    };
  }
};
