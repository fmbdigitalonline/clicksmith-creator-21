
import { supabase } from "@/integrations/supabase/client";

export async function uploadMedia(file: File, path: string = 'ad-images') {
  try {
    // Validate file size (5MB max for images, 10MB for videos)
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB for videos, 5MB for images
    if (file.size > maxSize) {
      throw new Error(`File size exceeds the ${isVideo ? '10MB' : '5MB'} limit`);
    }
    
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    const validTypes = [...validImageTypes, ...validVideoTypes];
    
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, WebP, GIF images or MP4, MOV, AVI, WebM videos');
    }
    
    // Choose the appropriate bucket based on file type
    const bucket = isVideo ? 'ad-videos' : 'ad-images';
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const sanitizedFileName = file.name.replace(/[^\x00-\x7F]/g, '');
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const filePath = `${path}/${timestamp}-${randomString}-${sanitizedFileName}`;
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    console.log(`${isVideo ? 'Video' : 'Image'} uploaded successfully:`, urlData.publicUrl);
    
    return {
      url: urlData.publicUrl,
      type: isVideo ? 'video' : 'image',
      filePath
    };
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}

// Helper function to update image/video in ad_feedback table
export async function updateAdImage(adId: string, mediaUrl: string, mediaType: string = 'image', mediaStatus: string = 'pending') {
  try {
    const { error } = await supabase
      .from('ad_feedback')
      .update({
        imageurl: mediaUrl,
        storage_url: mediaUrl,  // Update both fields to ensure consistency
        media_type: mediaType,
        image_status: mediaStatus
      })
      .eq('id', adId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating ad media:', error);
    throw error;
  }
}
