
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request body
    const body = await req.json();
    const { adId, batchSize = 10, batchProcess = false } = body;

    // If a specific ad ID is provided, only process that one
    if (adId) {
      console.log(`Processing single ad with ID: ${adId}`);
      const { data: ad, error: adError } = await supabase
        .from('ad_feedback')
        .select('id, imageUrl, imageurl, storage_url, image_status')
        .eq('id', adId)
        .single();

      if (adError) {
        throw new Error(`Error fetching ad: ${adError.message}`);
      }

      if (!ad) {
        throw new Error(`Ad with ID ${adId} not found`);
      }

      const result = await processImage(ad, supabase);
      return new Response(JSON.stringify({ success: true, processed: [result] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Batch processing mode
    if (batchProcess) {
      console.log(`Processing batch of ${batchSize} ads with pending or null storage_url`);
      const { data: ads, error: adsError } = await supabase
        .from('ad_feedback')
        .select('id, imageUrl, imageurl, storage_url, image_status')
        .or('image_status.is.null,image_status.eq.pending,storage_url.is.null')
        .limit(batchSize);

      if (adsError) {
        throw new Error(`Error fetching ads: ${adsError.message}`);
      }

      if (!ads || ads.length === 0) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'No pending ads found to process' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Found ${ads.length} ads to process`);
      const results = [];
      
      // Process images in sequence to avoid overwhelming the server
      for (const ad of ads) {
        try {
          const result = await processImage(ad, supabase);
          results.push(result);
        } catch (error) {
          console.error(`Error processing ad ${ad.id}:`, error);
          results.push({
            id: ad.id,
            success: false,
            error: error.message
          });
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        processed: results,
        count: results.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If no specific mode is requested, return usage instructions
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Please specify either an adId or set batchProcess to true' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });

  } catch (error) {
    console.error('Error in migrate-images function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Check function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function processImage(ad, supabase) {
  try {
    console.log(`Processing ad: ${ad.id}`);
    
    // Update status to processing
    await supabase
      .from('ad_feedback')
      .update({ 
        image_status: 'processing',
        original_url: ad.imageUrl || ad.imageurl
      })
      .eq('id', ad.id);
    
    // If we already have a storage URL, just validate and return
    if (ad.storage_url) {
      console.log(`Ad ${ad.id} already has storage URL: ${ad.storage_url}`);
      
      // Update status to ready
      await supabase
        .from('ad_feedback')
        .update({ 
          image_status: 'ready'
        })
        .eq('id', ad.id);
        
      return {
        id: ad.id,
        success: true,
        storage_url: ad.storage_url,
        status: 'already_processed'
      };
    }
    
    // Get the image URL (either imageUrl or imageurl)
    const imageUrl = ad.imageUrl || ad.imageurl;
    if (!imageUrl) {
      throw new Error('No image URL found');
    }
    
    // Download the image
    console.log(`Downloading image from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    
    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    
    // Generate a unique path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const userId = 'migrated';
    const fileName = `${userId}/${timestamp}-${crypto.randomUUID()}.webp`;
    
    // Upload to Supabase Storage
    console.log(`Uploading image to Supabase Storage: ${fileName}`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ad-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
      });
      
    if (uploadError) {
      throw uploadError;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('ad-images')
      .getPublicUrl(fileName);
    
    // Update the ad_feedback record
    await supabase
      .from('ad_feedback')
      .update({
        storage_url: publicUrl,
        original_url: imageUrl,
        image_status: 'ready',
        imageUrl: publicUrl,
        imageurl: publicUrl
      })
      .eq('id', ad.id);
    
    console.log(`Successfully processed ad ${ad.id}, new storage URL: ${publicUrl}`);
    
    return {
      id: ad.id,
      success: true,
      original_url: imageUrl,
      storage_url: publicUrl,
      status: 'processed'
    };
  } catch (error) {
    console.error(`Error processing image for ad ${ad.id}:`, error);
    
    // Update the ad record with the error
    await supabase
      .from('ad_feedback')
      .update({
        image_status: 'failed',
        original_url: ad.imageUrl || ad.imageurl
      })
      .eq('id', ad.id);
    
    return {
      id: ad.id,
      success: false,
      error: error.message
    };
  }
}
