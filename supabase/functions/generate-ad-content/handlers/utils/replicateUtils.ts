import { corsHeaders } from '../../../_shared/cors.ts';

export async function generateWithReplicate(
  replicate: any,
  prompt: string,
  dimensions: { width: number; height: number }
): Promise<string> {
  console.log('Starting image generation with Replicate:', { prompt, dimensions });

  try {
    // Calculate aspect ratio based on dimensions
    const aspectRatio = `${dimensions.width}:${dimensions.height}`;
    
    // Create prediction with FLUX 1.1 Pro in raw mode for more authentic results
    const prediction = await replicate.predictions.create({
      version: "2a966a1cdd9c20e8d63dbd562e7c8a1f4c78e62e6c5b042d44ba12a2c758b07f",
      input: {
        raw: true, // Enable raw mode for more authentic results
        prompt: prompt,
        aspect_ratio: aspectRatio,
        output_format: "jpg",
        safety_tolerance: 2,
        image_prompt_strength: 0.8 // Increased for better prompt adherence while maintaining authenticity
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