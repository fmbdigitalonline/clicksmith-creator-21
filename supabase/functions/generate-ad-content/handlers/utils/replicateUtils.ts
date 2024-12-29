import { corsHeaders } from '../../../_shared/cors.ts';
import Replicate from 'npm:replicate';

export async function generateWithReplicate(
  prompt: string,
  dimensions: { width: number; height: number }
): Promise<string> {
  console.log('Starting image generation with Replicate:', { prompt, dimensions });

  try {
    // Initialize Replicate client with API token from environment
    const replicate = new Replicate({
      auth: Deno.env.get('REPLICATE_API_TOKEN'),
    });

    if (!replicate.auth) {
      throw new Error('REPLICATE_API_TOKEN is not set');
    }

    // Calculate aspect ratio based on dimensions
    const aspectRatio = `${dimensions.width}:${dimensions.height}`;
    console.log('Using aspect ratio:', aspectRatio);

    // Create prediction with Flux model
    console.log('Creating prediction with Flux model...');
    const prediction = await replicate.predictions.create({
      version: "2a966a1cdd9c3cd6b3ef23f0764931360640be3f9416f32f6361a6f0731af6cb",  // Correct Flux model version
      input: {
        prompt: prompt,
        aspect_ratio: aspectRatio,
        negative_prompt: "blurry, low quality, distorted, deformed, ugly, bad anatomy",
      }
    });

    console.log('Prediction created:', prediction);

    // Configuration for polling
    const maxAttempts = 60; // 5 minutes total with 5s interval
    const pollInterval = 5000; // 5 seconds
    let attempts = 0;
    let result = null;

    while (attempts < maxAttempts) {
      console.log(`Polling attempt ${attempts + 1}/${maxAttempts}`);
      
      try {
        result = await replicate.predictions.get(prediction.id);
        console.log('Poll result:', result);

        if (result.status === "succeeded") {
          console.log('Generation succeeded:', result);
          if (!result.output) {
            throw new Error('No output received from successful generation');
          }
          const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
          if (!imageUrl) {
            throw new Error('No valid image URL in output');
          }
          return imageUrl;
        }
        
        if (result.status === "failed") {
          throw new Error(`Generation failed: ${result.error || 'Unknown error'}`);
        }

        if (result.status === "canceled") {
          throw new Error('Image generation was canceled');
        }

        // If still processing, wait before next attempt
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;
      } catch (pollError) {
        console.error('Error during polling:', pollError);
        // Only throw if we've exhausted our attempts
        if (attempts >= maxAttempts - 1) {
          throw pollError;
        }
        // Otherwise, continue polling
        attempts++;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error(`Image generation timed out after ${maxAttempts * pollInterval / 1000} seconds`);
  } catch (error) {
    console.error('Error in generateWithReplicate:', error);
    throw error;
  }
}