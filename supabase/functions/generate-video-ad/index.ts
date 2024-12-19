import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { businessIdea, targetAudience, hook } = await req.json();
    
    // Get the Replicate API token from environment variables
    const replicateApiToken = Deno.env.get('REPLICATE_API_TOKEN');
    if (!replicateApiToken) {
      throw new Error('Replicate API token not configured');
    }

    // Generate the prompt for the video
    const prompt = `Create a video advertisement for:
      ${businessIdea.description}
      Target audience: ${targetAudience.description}
      Hook: ${hook.text}
      Style: Professional, engaging, business-appropriate
      Requirements: High quality, clear message, compelling visuals`;

    // Call Replicate API
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${replicateApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "847dfa8b01e739637fc76f480ede0c1d76408e1d694b830b5dfb8e547bf98405",
        input: {
          prompt: prompt,
          num_frames: 90, // 3 seconds at 30fps
          width: 1024,
          height: 576,
          guidance_scale: 7.5,
          num_inference_steps: 50
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Replicate API error: ${error.detail || 'Unknown error'}`);
    }

    const prediction = await response.json();
    console.log('Video generation started:', prediction);

    // Poll for completion
    const videoUrl = await pollForCompletion(prediction.id, replicateApiToken);

    return new Response(
      JSON.stringify({ 
        success: true, 
        videoUrl,
        prompt 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error generating video:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
});

async function pollForCompletion(predictionId: string, apiToken: string, maxAttempts = 60): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          "Authorization": `Token ${apiToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check prediction status: ${response.statusText}`);
    }

    const prediction = await response.json();
    if (prediction.status === 'succeeded') {
      return prediction.output;
    } else if (prediction.status === 'failed') {
      throw new Error(`Video generation failed: ${prediction.error || 'Unknown error'}`);
    }

    // Wait 2 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Video generation timed out');
}