
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { prompt, negative_prompt, width, height } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log('Generating image with params:', {
      prompt,
      negative_prompt,
      width: width || 1024,
      height: height || 1024
    });

    // Initialize Supabase client for storage operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call Replicate API
    const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN');
    if (!REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is not set');
    }

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "black-forest-labs/flux-1.1-pro-ultra",
        input: {
          prompt,
          negative_prompt: negative_prompt || "",
          width: width || 1024,
          height: height || 1024,
          num_outputs: 1,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Replicate API error:', error);
      throw new Error(`Replicate API error: ${error.detail || 'Unknown error'}`);
    }

    const prediction = await response.json();
    console.log('Replicate prediction created:', prediction);

    // Poll for the result
    const maxAttempts = 60;
    let attempts = 0;
    let result = null;

    while (attempts < maxAttempts) {
      const checkResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            "Authorization": `Token ${REPLICATE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!checkResponse.ok) {
        throw new Error('Failed to check prediction status');
      }

      const predictionStatus = await checkResponse.json();
      console.log('Prediction status:', predictionStatus.status);

      if (predictionStatus.status === "succeeded") {
        result = predictionStatus.output;
        break;
      } else if (predictionStatus.status === "failed") {
        throw new Error('Image generation failed');
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!result) {
      throw new Error('Generation timed out');
    }

    console.log('Generation successful:', result);
    const imageUrl = result[0];

    // Now download the image and store it in Supabase Storage
    // We'll do this in the background so we don't delay the response
    const storeImagePromise = (async () => {
      try {
        console.log('Downloading image from URL:', imageUrl);
        
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
        }
        
        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();
        
        // Generate a unique path including a timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const userId = 'system'; // Default to system if no user context
        const fileName = `${userId}/${timestamp}-${crypto.randomUUID()}.webp`;
        
        console.log('Uploading image to Supabase Storage:', fileName);
        
        // Upload the image to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('ad-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/webp',
            cacheControl: '3600',
          });
          
        if (uploadError) {
          console.error('Error uploading to Supabase Storage:', uploadError);
          throw uploadError;
        }
        
        // Get public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('ad-images')
          .getPublicUrl(fileName);
          
        console.log('Image stored in Supabase, public URL:', publicUrl);
        
        return { 
          original: imageUrl, 
          storage: publicUrl 
        };
      } catch (error) {
        console.error('Error in background image processing:', error);
        return { 
          original: imageUrl, 
          storage: null, 
          error: error.message 
        };
      }
    })();
    
    // Start the background job without awaiting it
    // This will allow us to return the response faster
    EdgeRuntime.waitUntil(storeImagePromise);

    return new Response(JSON.stringify({ 
      url: imageUrl,
      prediction_id: prediction.id,
      storage_pending: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-images function:', error);
    return new Response(
      JSON.stringify({ 
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
