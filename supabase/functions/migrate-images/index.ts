
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

    console.log(`Starting image processing for ad: ${adId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // First update status to processing
    const { error: updateError } = await supabase
      .from('ad_feedback')
      .update({ image_status: 'processing' })
      .eq('id', adId);

    if (updateError) {
      console.error('Error updating status to processing:', updateError);
      throw updateError;
    }

    // Get the original image URL
    const { data: adData, error: fetchError } = await supabase
      .from('ad_feedback')
      .select('original_url')
      .eq('id', adId)
      .single();

    if (fetchError || !adData?.original_url) {
      console.error('Error fetching original URL:', fetchError);
      throw new Error('Could not fetch original image URL');
    }

    console.log(`Found original URL for ad ${adId}`);

    try {
      // Download the original image
      const imageResponse = await fetch(adData.original_url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }

      const contentType = imageResponse.headers.get('content-type');
      const imageBlob = await imageResponse.blob();
      const imageBuffer = await imageBlob.arrayBuffer();

      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `processed/${adId}/${timestamp}.webp`;

      console.log(`Uploading processed image as: ${fileName}`);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ad-images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/webp',
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('ad-images')
        .getPublicUrl(fileName);

      console.log(`Successfully processed image. Public URL: ${publicUrl}`);

      // Update the ad with the new storage URL and status
      const { error: finalUpdateError } = await supabase
        .from('ad_feedback')
        .update({
          storage_url: publicUrl,
          image_status: 'ready'
        })
        .eq('id', adId);

      if (finalUpdateError) {
        console.error('Error updating final status:', finalUpdateError);
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
      console.error('Processing error:', processingError);
      
      // Update status to failed
      await supabase
        .from('ad_feedback')
        .update({
          image_status: 'failed',
          error_message: processingError.message
        })
        .eq('id', adId);

      throw processingError;
    }

  } catch (error) {
    console.error('Error in migrate-images function:', error);
    
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
