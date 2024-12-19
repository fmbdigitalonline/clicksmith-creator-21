import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { businessIdea, targetAudience, hook, size } = await req.json();
    
    const replicateApiToken = Deno.env.get('REPLICATE_API_TOKEN');
    if (!replicateApiToken) {
      throw new Error('Replicate API token not configured');
    }

    // Generate a more specific prompt for better video quality
    const prompt = `Create a professional video advertisement that shows:
      ${businessIdea.description}
      Target audience: ${targetAudience.description}
      Marketing message: ${hook.text}
      Style: Modern, professional video advertisement
      Must include: Dynamic visuals, smooth transitions
      Video requirements: High quality, clear message, compelling visuals
      Video dimensions: ${size.width}x${size.height}`;

    console.log('Starting video generation with prompt:', prompt);

    // Use a more reliable model for video generation
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${replicateApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Using Stable Video Diffusion model
        version: "9ca9f2058a799b5e52bcdc1db4c385a869c4feff51b9ab6cf1f9d5d4ebe8e87c",
        input: {
          prompt: prompt,
          video_length: "4_seconds", // Start with shorter videos for testing
          fps: 24,
          width: size.width,
          height: size.height,
          num_inference_steps: 50,
          guidance_scale: 17.5, // Increased for better prompt adherence
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Replicate API error:', error);
      throw new Error(`Replicate API error: ${error.detail || 'Unknown error'}`);
    }

    const prediction = await response.json();
    console.log('Video generation started:', prediction);

    // Poll for completion with improved error handling
    const videoUrl = await pollForCompletion(prediction.id, replicateApiToken);
    console.log('Video generation completed:', videoUrl);

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
    console.log(`Polling attempt ${i + 1} for prediction ${predictionId}`);
    
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
    console.log('Polling status:', prediction.status);
    
    if (prediction.status === 'succeeded') {
      console.log('Video generation completed:', prediction.output);
      return prediction.output;
    } else if (prediction.status === 'failed') {
      throw new Error(`Video generation failed: ${prediction.error || 'Unknown error'}`);
    }

    // Wait 2 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Video generation timed out');
}