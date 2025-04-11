import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser support
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Main function to handle requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { adId, adIds } = await req.json();
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // If batch processing requested
    if (adIds && Array.isArray(adIds) && adIds.length > 0) {
      const results = await Promise.all(
        adIds.map(id => processAdMedia(id, supabaseAdmin))
      );

      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: results.filter(r => r !== null)
        }),
        { 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    } 
    // Single ad processing
    else if (adId) {
      const result = await processAdMedia(adId, supabaseAdmin);
      
      if (result) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            processed: result
          }),
          { 
            headers: { 
              ...corsHeaders,
              "Content-Type": "application/json"
            }
          }
        );
      } else {
        throw new Error("Failed to process media");
      }
    } else {
      throw new Error("No adId or adIds provided");
    }
  } catch (error) {
    console.error("Error in migrate-images function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      }
    );
  }
});

// Process a single ad media
async function processAdMedia(adId: string, supabase: any) {
  try {
    // Get ad data including media type
    const { data: ad, error: getError } = await supabase
      .from('ad_feedback')
      .select('imageurl, original_url, media_type')
      .eq('id', adId)
      .single();
    
    if (getError) throw getError;
    if (!ad || !ad.imageurl) return null;
    
    const isVideo = ad.media_type === 'video';
    const sourceUrl = ad.original_url || ad.imageurl;
    
    // Process based on media type
    if (isVideo) {
      // For videos, we just update the status to processing
      const { error: updateError } = await supabase
        .from('ad_feedback')
        .update({ 
          image_status: 'ready',
          storage_url: sourceUrl
        })
        .eq('id', adId);
      
      if (updateError) throw updateError;
      
      return {
        adId,
        success: true,
        storage_url: sourceUrl
      };
    } else {
      // For images, process through Facebook's requirements
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
      
      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      // Generate a unique filename for the processed image
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      const fileExtension = contentType.split('/')[1] || 'jpg';
      const fileName = `processed-${timestamp}-${randomString}.${fileExtension}`;
      
      // Upload the image to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ad-images-processed')
        .upload(fileName, imageBuffer, {
          contentType,
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Get the public URL of the processed image
      const { data: urlData } = supabase.storage
        .from('ad-images-processed')
        .getPublicUrl(fileName);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL for processed image');
      }
      
      // Update the ad record with the processed image URL
      const { error: updateError } = await supabase
        .from('ad_feedback')
        .update({
          storage_url: urlData.publicUrl,
          image_status: 'ready'
        })
        .eq('id', adId);
      
      if (updateError) throw updateError;
      
      return {
        adId,
        success: true,
        storage_url: urlData.publicUrl
      };
    }
  } catch (error) {
    console.error(`Error processing ad ${adId}:`, error);
    
    // Update status to failed
    try {
      await supabase
        .from('ad_feedback')
        .update({ image_status: 'failed' })
        .eq('id', adId);
    } catch (updateError) {
      console.error('Error updating status to failed:', updateError);
    }
    
    return {
      adId,
      success: false,
      error: error.message
    };
  }
}
