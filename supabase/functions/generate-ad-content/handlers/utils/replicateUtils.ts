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

    // Calculate aspect ratio from dimensions
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(dimensions.width, dimensions.height);
    const aspectRatio = `${dimensions.width/divisor}:${dimensions.height/divisor}`;
    
    console.log('Using aspect ratio:', aspectRatio);

    // Create prediction with Flux model
    console.log('Creating prediction with Flux model...');
    const prediction = await replicate.predictions.create({
      // Latest stable version of Flux model
      version: "6c9ae690c241f5149121c6b2e5c05f48ff1f9551ad2f61c1d01eda6621852657",
      input: {
        prompt: prompt,
        aspect_ratio: aspectRatio,
        negative_prompt: "blurry, low quality, distorted, deformed, ugly, bad anatomy",
        safety_tolerance: 2,
        output_format: "jpg",
        raw: false
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
          // The output is a string URL as per the output schema
          const imageUrl = result.output;
          if (!imageUrl || typeof imageUrl !== 'string') {
            throw new Error('Invalid output format from Replicate');
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