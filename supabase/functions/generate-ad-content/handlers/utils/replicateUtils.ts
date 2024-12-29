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

    // Run the Flux model directly
    console.log('Running Flux model...');
    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro-ultra",
      {
        input: {
          prompt: prompt,
          aspect_ratio: aspectRatio,
          negative_prompt: "blurry, low quality, distorted, deformed, ugly, bad anatomy",
          safety_tolerance: 2,
          output_format: "jpg",
          raw: false
        }
      }
    );

    console.log('Generation output:', output);

    // Validate output
    if (!output || typeof output !== 'string') {
      throw new Error('Invalid output format from Replicate');
    }

    return output;

  } catch (error) {
    console.error('Error in generateWithReplicate:', error);
    throw error;
  }
}