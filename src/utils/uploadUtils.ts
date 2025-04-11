
import { supabase } from "@/integrations/supabase/client";

export async function uploadMedia(file: File, path: string = 'ad-images') {
  try {
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error(`File size exceeds the 10MB limit`);
    }
    
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const validTypes = [...validImageTypes, ...validVideoTypes];
    
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, WebP images or MP4, WebM, MOV videos');
    }
    
    const isVideo = validVideoTypes.includes(file.type);
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const sanitizedFileName = file.name.replace(/[^\x00-\x7F]/g, '');
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const filePath = `${path}/${timestamp}-${randomString}-${sanitizedFileName}`;
    
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
    
    console.log('File uploaded successfully:', urlData.publicUrl);
    
    return {
      url: urlData.publicUrl,
      isVideo: isVideo
    };
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}

// Helper function to update image or video in ad_feedback table
export async function updateAdImage(adId: string, mediaUrl: string, isVideo: boolean = false, mediaStatus: string = 'pending') {
  try {
    const { error } = await supabase
      .from('ad_feedback')
      .update({
        imageurl: mediaUrl,
        storage_url: mediaUrl,
        image_status: mediaStatus,
        media_type: isVideo ? 'video' : 'image'
      })
      .eq('id', adId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating ad image:', error);
    throw error;
  }
}
