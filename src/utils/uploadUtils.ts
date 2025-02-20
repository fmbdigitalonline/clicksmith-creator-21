
import { supabase } from "@/integrations/supabase/client";

export async function uploadMedia(file: File) {
  const fileExt = file.name.split('.').pop();
  const sanitizedFileName = file.name.replace(/[^\x00-\x7F]/g, '');
  const filePath = `${crypto.randomUUID()}-${sanitizedFileName}`;
  
  const { data, error } = await supabase.storage
    .from('blog-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('blog-media')
    .getPublicUrl(filePath);

  return publicUrl;
}
