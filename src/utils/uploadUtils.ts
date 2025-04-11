
import { supabase } from "@/integrations/supabase/client";

export interface MediaUploadResult {
  url: string;
  isVideo: boolean;
  fileType: string;
}

export async function uploadMedia(file: File, path: string = 'ad-images'): Promise<MediaUploadResult> {
  try {
    // Validate file size (50MB max for videos, 5MB max for images)
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB or 5MB in bytes
    
    if (file.size > maxSize) {
      throw new Error(`File size exceeds the ${isVideo ? '50MB' : '5MB'} limit`);
    }
    
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    const validTypes = isVideo ? validVideoTypes : validImageTypes;
    
    if (!validTypes.includes(file.type)) {
      throw new Error(
        isVideo 
          ? 'Invalid file type. Please upload MP4, MOV, AVI or WebM videos.' 
          : 'Invalid file type. Please upload JPG, PNG, or WebP images'
      );
    }
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const sanitizedFileName = file.name.replace(/[^\x00-\x7F]/g, '');
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const filePath = `${path}/${timestamp}-${randomString}-${sanitizedFileName}`;
    
    // Upload to Supabase storage
    const bucketName = isVideo ? 'ad-videos' : 'ad-images';
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    console.log(`${isVideo ? 'Video' : 'File'} uploaded successfully:`, urlData.publicUrl);
    
    return {
      url: urlData.publicUrl,
      isVideo: isVideo,
      fileType: file.type
    };
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}

// Helper function to update image/video in ad_feedback table
export async function updateAdMedia(adId: string, mediaData: MediaUploadResult, mediaStatus: string = 'pending') {
  try {
    const { error } = await supabase
      .from('ad_feedback')
      .update({
        imageurl: mediaData.url,
        storage_url: mediaData.url,
        image_status: mediaStatus,
        media_type: mediaData.isVideo ? 'video' : 'image',
        file_type: mediaData.fileType
      })
      .eq('id', adId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating ad media:', error);
    throw error;
  }
}

// Backward compatibility function
export async function updateAdImage(adId: string, imageUrl: string, imageStatus: string = 'pending') {
  try {
    const { error } = await supabase
      .from('ad_feedback')
      .update({
        imageurl: imageUrl,
        storage_url: imageUrl,
        image_status: imageStatus,
        media_type: 'image'
      })
      .eq('id', adId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating ad image:', error);
    throw error;
  }
}
