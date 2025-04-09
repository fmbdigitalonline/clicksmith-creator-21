
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Replicate from "https://esm.sh/replicate@0.25.2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY')
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY is not set')
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set')
    }
    
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    const { prompt, adId } = await req.json()

    if (!adId) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required field: adId is required" 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Use a default prompt if none is provided
    const promptText = prompt || "Professional marketing image for advertisement";
    
    console.log("Starting image regeneration for ad:", adId);
    console.log("Using prompt:", promptText);

    // Check if this ad already exists in the database
    const { data: existingAd } = await supabaseAdmin
      .from('ad_feedback')
      .select('id')
      .eq('id', adId)
      .single();
    
    // If this is an existing ad in the database, update its status
    if (existingAd) {
      await supabaseAdmin
        .from('ad_feedback')
        .update({ image_status: 'processing' })
        .eq('id', adId);
    }

    console.log("Generating image with prompt:", promptText);
    const output = await replicate.run(
      "stability-ai/sdxl:1bfb924045802467cf8869d96b231a12e6aa994a3b779be5c88c6499a0b7d92d",
      {
        input: {
          width: 1024,
          height: 1024,
          prompt: promptText,
          refine: "expert_ensemble_refiner",
          scheduler: "K_EULER",
          lora_scale: 0.6,
          num_outputs: 1,
          guidance_scale: 7.5,
          apply_watermark: false,
          high_noise_frac: 0.8,
          negative_prompt: "blurry, low quality, low resolution",
          prompt_strength: 0.8,
          num_inference_steps: 25
        }
      }
    )

    // Get the generated image URL
    let imageUrl = null;
    if (Array.isArray(output) && output.length > 0) {
      imageUrl = output[0];
    } else {
      imageUrl = output;
    }

    if (!imageUrl) {
      throw new Error("Failed to generate image, no URL returned");
    }

    console.log("Generated image:", imageUrl);

    // Upload the image to the storage bucket
    const timestamp = Date.now();
    const imageName = `generated/${adId}/${timestamp}.jpg`;
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch the generated image: ${imageResponse.statusText}`);
    }
    
    const imageBlob = await imageResponse.blob();
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('ad_images')
      .upload(imageName, imageBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true,
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL for the uploaded image
    const { data: publicUrlData } = supabaseAdmin
      .storage
      .from('ad_images')
      .getPublicUrl(imageName);
      
    const storageUrl = publicUrlData.publicUrl;
    
    // If this is an existing ad in the database, update it with the new image
    if (existingAd) {
      await supabaseAdmin
        .from('ad_feedback')
        .update({ 
          storage_url: storageUrl,
          image_status: 'ready',
          imageurl: imageUrl,  // Keep the original URL as backup
        })
        .eq('id', adId);
    }

    console.log("Image regeneration complete for ad:", adId);
    return new Response(JSON.stringify({ 
      success: true,
      message: "Image regenerated successfully",
      imageUrl: storageUrl,
      originalImageUrl: imageUrl,
      adId: adId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in generate-images function:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
