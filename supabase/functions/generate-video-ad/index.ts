import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Replicate } from "https://esm.sh/replicate@0.25.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { businessIdea, targetAudience, hook, format } = await req.json();
    
    const replicateApiToken = Deno.env.get('REPLICATE_API_TOKEN');
    if (!replicateApiToken) {
      throw new Error('Replicate API token not configured');
    }

    console.log('Starting video generation with inputs:', {
      businessIdea,
      targetAudience,
      hook,
      format
    });

    const replicate = new Replicate({
      auth: replicateApiToken,
    });

    // Generate a more specific prompt for better video quality
    const prompt = `Create a professional video advertisement that shows:
      ${businessIdea.description}
      Target audience: ${targetAudience.description}
      Marketing message: ${hook.text}
      Style: Modern, professional video advertisement
      Must include: Dynamic visuals, smooth transitions
      Video requirements: High quality, clear message, compelling visuals
      Format: ${format.description}
      Dimensions: ${format.dimensions.width}x${format.dimensions.height}`;

    console.log('Using prompt for video generation:', prompt);

    // Use Stable Video Diffusion model
    const prediction = await replicate.predictions.create({
      version: "9ca9f2058a799b5e52bcdc1db4c385a869c4feff51b9ab6cf1f9d5d4ebe8e87c",
      input: {
        prompt: prompt,
        video_length: format.maxLength > 30 ? "30_seconds" : `${format.maxLength}_seconds`,
        fps: 24,
        width: format.dimensions.width,
        height: format.dimensions.height,
        num_inference_steps: 50,
        guidance_scale: 17.5,
        negative_prompt: "blurry, low quality, amateurish, unprofessional"
      },
    });

    console.log('Video generation started:', prediction);

    // Poll for completion
    let result = prediction;
    const maxAttempts = 60;
    const pollInterval = 2000;

    for (let i = 0; i < maxAttempts; i++) {
      if (result.status === "succeeded") {
        console.log('Video generation completed successfully:', result);
        break;
      }
      
      if (result.status === "failed") {
        throw new Error(`Video generation failed: ${result.error}`);
      }

      console.log(`Polling attempt ${i + 1}, status: ${result.status}`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      result = await replicate.predictions.get(prediction.id);
    }

    if (result.status !== "succeeded") {
      throw new Error('Video generation timed out or failed');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        videoUrl: result.output,
        prompt,
        format 
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