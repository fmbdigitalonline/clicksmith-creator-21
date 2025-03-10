
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { adId } = await req.json();
    
    if (!adId) {
      throw new Error('Ad ID is required');
    }

    console.log(`[migrate-images] Starting image processing for ad: ${adId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // First update status to processing immediately
    console.log(`[migrate-images] Updating status to processing for ad: ${adId}`);
    const { error: updateError } = await supabase
      .from('ad_feedback')
      .update({ image_status: 'processing' })
      .eq('id', adId);

    if (updateError) {
      console.error('[migrate-images] Error updating status to processing:', updateError);
      throw updateError;
    }

    // Get the original image URL
    console.log(`[migrate-images] Fetching original URL for ad: ${adId}`);
    const { data: adData, error: fetchError } = await supabase
      .from('ad_feedback')
      .select('original_url')
      .eq('id', adId)
      .single();

    if (fetchError || !adData?.original_url) {
      console.error('[migrate-images] Error fetching original URL:', fetchError);
      await updateStatusToFailed(supabase, adId, 'Could not fetch original image URL');
      throw new Error('Could not fetch original image URL');
    }

    console.log(`[migrate-images] Found original URL for ad ${adId}: ${adData.original_url.substring(0, 50)}...`);

    try {
      // Download the original image
      console.log(`[migrate-images] Downloading image for ad: ${adId}`);
      const imageResponse = await fetch(adData.original_url, {
        headers: {
          'Accept': 'image/*',
          'User-Agent': 'Mozilla/5.0 (compatible; Bolt/1.0; +http://example.com)'
        }
      });
      
      if (!imageResponse.ok) {
        console.error(`[migrate-images] Failed to download image: ${imageResponse.status}`);
        await updateStatusToFailed(supabase, adId, `Failed to download image: ${imageResponse.status}`);
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }

      const contentType = imageResponse.headers.get('content-type');
      console.log(`[migrate-images] Image content type: ${contentType}`);
      
      const imageBlob = await imageResponse.blob();
      console.log(`[migrate-images] Image size: ${(imageBlob.size / 1024).toFixed(2)} KB`);
      
      const imageBuffer = await imageBlob.arrayBuffer();

      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `processed/${adId}/${timestamp}.webp`;

      console.log(`[migrate-images] Uploading processed image as: ${fileName}`);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ad-images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/webp',
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('[migrate-images] Upload error:', uploadError);
        await updateStatusToFailed(supabase, adId, `Upload error: ${uploadError.message}`);
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('ad-images')
        .getPublicUrl(fileName);

      console.log(`[migrate-images] Successfully processed image. Public URL: ${publicUrl.substring(0, 50)}...`);

      // Update the ad with the new storage URL and status
      const { error: finalUpdateError } = await supabase
        .from('ad_feedback')
        .update({
          storage_url: publicUrl,
          image_status: 'ready'
        })
        .eq('id', adId);

      if (finalUpdateError) {
        console.error('[migrate-images] Error updating final status:', finalUpdateError);
        await updateStatusToFailed(supabase, adId, `Error updating final status: ${finalUpdateError.message}`);
        throw finalUpdateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Image processed successfully',
          storage_url: publicUrl
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );

    } catch (processingError) {
      console.error('[migrate-images] Processing error:', processingError);
      await updateStatusToFailed(supabase, adId, processingError.message);
      throw processingError;
    }

  } catch (error) {
    console.error('[migrate-images] Error in migrate-images function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Check function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

// Helper function to update status to failed
async function updateStatusToFailed(supabase, adId, errorMessage) {
  console.log(`[migrate-images] Updating status to failed for ad ${adId}: ${errorMessage}`);
  try {
    await supabase
      .from('ad_feedback')
      .update({
        image_status: 'failed',
        error_message: errorMessage
      })
      .eq('id', adId);
  } catch (updateError) {
    console.error('[migrate-images] Error updating status to failed:', updateError);
  }
}
