
import { supabase } from "@/integrations/supabase/client";

export async function uploadMedia(file: File, path: string = 'ad-images') {
  try {
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error(`File size exceeds the 5MB limit`);
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, or WebP images');
    }
    
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
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}

// Helper function to update image in ad_feedback table
export async function updateAdImage(adId: string, imageUrl: string, imageStatus: string = 'pending') {
  try {
    const { error } = await supabase
      .from('ad_feedback')
      .update({
        imageurl: imageUrl,
        storage_url: imageUrl,  // Update both fields to ensure consistency
        image_status: imageStatus
      })
      .eq('id', adId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating ad image:', error);
    throw error;
  }
}
