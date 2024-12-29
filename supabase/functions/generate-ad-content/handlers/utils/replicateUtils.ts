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

    // Create prediction with SDXL Lightning model
    const prediction = await replicate.predictions.create({
      version: "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
      input: {
        prompt: prompt,
        width: dimensions.width,
        height: dimensions.height,
        num_outputs: 1,
        guidance_scale: 7.5,
        negative_prompt: "blurry, low quality, distorted, deformed",
      }
    });

    console.log('Prediction created:', prediction);

    const maxWaitTime = 180000; // 3 minutes
    const pollInterval = 5000; // Poll every 5 seconds
    const startTime = Date.now();
    let result;
    let lastStatus = '';
    let retryCount = 0;
    const maxRetries = 3;

    while (!result && Date.now() - startTime < maxWaitTime) {
      try {
        result = await replicate.predictions.get(prediction.id);
        
        if (result.status !== lastStatus) {
          console.log(`Generation status updated to: ${result.status}`);
          lastStatus = result.status;
        }
        
        if (result.status === "succeeded") {
          break;
        } else if (result.status === "failed") {
          if (retryCount < maxRetries) {
            console.log(`Retry attempt ${retryCount + 1} of ${maxRetries}`);
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          throw new Error(`Prediction failed: ${result.error}`);
        } else if (result.status === "canceled") {
          throw new Error('Image generation was canceled');
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (pollError) {
        console.error('Error polling prediction status:', pollError);
        if (retryCount < maxRetries) {
          console.log(`Retry attempt ${retryCount + 1} of ${maxRetries}`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        throw pollError;
      }
    }

    if (!result || result.status !== "succeeded") {
      throw new Error('Image generation timed out or failed');
    }

    console.log('Generation result:', result);

    if (!result.output) {
      throw new Error('No output received from image generation');
    }

    const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
    
    if (!imageUrl) {
      throw new Error('No valid image URL in output');
    }

    return imageUrl;
  } catch (error) {
    console.error('Error in generateWithReplicate:', error);
    throw error;
  }
}