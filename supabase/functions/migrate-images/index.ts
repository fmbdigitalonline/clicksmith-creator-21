
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from "../_shared/cors.ts";

// Global constants for configuration
const MAX_CONCURRENT_PROCESSING = 3; // Process up to 3 images in parallel
const PROCESSING_TIMEOUT = 30000; // 30 seconds timeout for image processing
const USER_AGENT = 'Mozilla/5.0 (compatible; BoltAdImageProcessor/1.0)';

interface ProcessImageResult {
  adId: string;
  success: boolean;
  storage_url?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const singleAdId = body.adId;
    const adIds = body.adIds || (singleAdId ? [singleAdId] : null);
    
    if (!adIds || adIds.length === 0) {
      throw new Error('At least one ad ID is required');
    }

    console.log(`[migrate-images] Starting batch image processing for ${adIds.length} ads`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update all ads to processing status immediately
    await updateStatusToBatch(supabase, adIds, 'processing');
    
    // Process images in parallel with controlled concurrency
    const results = await processImagesWithConcurrency(supabase, adIds);
    
    console.log(`[migrate-images] Batch processing completed: ${results.filter(r => r.success).length}/${results.length} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} images`,
        processed: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

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

// Process images with controlled concurrency
async function processImagesWithConcurrency(supabase, adIds) {
  const results: ProcessImageResult[] = [];
  const queue = [...adIds];
  const inProgress = new Set();
  
  return new Promise(async (resolve) => {
    async function processNext() {
      if (queue.length === 0 && inProgress.size === 0) {
        resolve(results);
        return;
      }
      
      while (queue.length > 0 && inProgress.size < MAX_CONCURRENT_PROCESSING) {
        const adId = queue.shift()!;
        inProgress.add(adId);
        
        processImage(supabase, adId)
          .then(result => {
            results.push(result);
            inProgress.delete(adId);
            processNext();
          })
          .catch(error => {
            console.error(`[migrate-images] Error processing ad ${adId}:`, error);
            results.push({ adId, success: false, error: error.message });
            inProgress.delete(adId);
            processNext();
          });
      }
    }
    
    processNext();
  });
}

// Process a single image with timeout
async function processImage(supabase, adId): Promise<ProcessImageResult> {
  const timeoutPromise = new Promise<ProcessImageResult>((_, reject) => {
    setTimeout(() => reject(new Error(`Processing timed out after ${PROCESSING_TIMEOUT}ms`)), PROCESSING_TIMEOUT);
  });
  
  const processingPromise = processImageInternal(supabase, adId);
  
  return Promise.race([processingPromise, timeoutPromise]);
}

// Internal function to process a single image
async function processImageInternal(supabase, adId): Promise<ProcessImageResult> {
  console.log(`[migrate-images] Processing image for ad: ${adId}`);
  
  try {
    const { data: adData, error: fetchError } = await supabase
      .from('ad_feedback')
      .select('original_url, imageUrl, imageurl')
      .eq('id', adId)
      .single();

    if (fetchError || !adData) {
      throw new Error(`Could not fetch ad data: ${fetchError?.message || 'No data returned'}`);
    }
    
    const originalUrl = adData.original_url || adData.imageUrl || adData.imageurl;
    
    if (!originalUrl) {
      throw new Error('No image URL found in ad data');
    }

    console.log(`[migrate-images] Found original URL for ad ${adId}: ${originalUrl.substring(0, 50)}...`);

    // Download the original image with improved headers
    const imageResponse = await fetch(originalUrl, {
      headers: {
        'Accept': 'image/*',
        'User-Agent': USER_AGENT
      }
    });
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    
    console.log(`[migrate-images] Downloaded image for ad ${adId}: ${(imageBlob.size / 1024).toFixed(2)} KB, type: ${contentType}`);

    // Generate a unique filename with optimized structure
    const fileName = `processed/${adId}/${Date.now()}.webp`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ad-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600'
      });

    if (uploadError) {
      throw new Error(`Upload error: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('ad-images')
      .getPublicUrl(fileName);

    console.log(`[migrate-images] Uploaded image for ad ${adId}, URL: ${publicUrl.substring(0, 50)}...`);

    // Update the ad with the new storage URL and status
    const { error: updateError } = await supabase
      .from('ad_feedback')
      .update({
        storage_url: publicUrl,
        image_status: 'ready'
      })
      .eq('id', adId);

    if (updateError) {
      throw new Error(`Error updating status: ${updateError.message}`);
    }

    console.log(`[migrate-images] Successfully processed image for ad ${adId}`);
    return { adId, success: true, storage_url: publicUrl };

  } catch (error) {
    console.error(`[migrate-images] Error processing image for ad ${adId}:`, error);
    
    // Update the ad status to failed
    await updateStatusToFailed(supabase, adId, error.message);
    
    return { 
      adId, 
      success: false, 
      error: error.message 
    };
  }
}

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

// Update multiple ads to a specific status
async function updateStatusToBatch(supabase, adIds, status) {
  console.log(`[migrate-images] Batch updating ${adIds.length} ads to status: ${status}`);
  
  // Process in batches of 100 to avoid request size limits
  const batchSize = 100;
  for (let i = 0; i < adIds.length; i += batchSize) {
    const batch = adIds.slice(i, i + batchSize);
    try {
      const { error } = await supabase
        .from('ad_feedback')
        .update({ image_status: status })
        .in('id', batch);
      
      if (error) {
        console.error(`[migrate-images] Error updating batch status: ${error.message}`);
      }
    } catch (error) {
      console.error(`[migrate-images] Error in batch update: ${error.message}`);
    }
  }
}
