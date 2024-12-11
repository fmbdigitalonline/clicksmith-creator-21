import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as fal from 'npm:@fal-ai/serverless-client';

const falApiKey = Deno.env.get('FAL_API_KEY');
const falKeyId = Deno.env.get('FAL_KEY_ID');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function handleImagePromptGeneration(businessIdea: any, targetAudience: any, campaign: any) {
  console.log('Starting fal.ai image generation...');
  
  const prompt = `Generate a Facebook ad image based on this business:
${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}

Target Audience:
${targetAudience.name}
${targetAudience.description}

Make it:
- Ultra-realistic, professional photography style
- Clean composition with space for text overlay
- Vibrant, engaging colors
- Maximum 2 people per image
- High-end commercial look
- Perfect for Facebook ads`;

  console.log('Generated prompt:', prompt);

  try {
    // Initialize fal client
    fal.config({
      credentials: {
        keyId: falKeyId,
        keySecret: falApiKey,
      },
    });

    // Generate 6 images in parallel
    const imagePromises = Array(6).fill(null).map(async () => {
      try {
        console.log('Generating image with prompt:', prompt);
        const result = await fal.subscribe('fal-ai/fast-sdxl', {
          input: {
            prompt: prompt,
            image_size: "square_hd",
            num_inference_steps: 50,
            guidance_scale: 7.5,
            negative_prompt: "text, watermark, low quality, blurry, distorted",
          },
        });

        // The result contains a URL that we can use directly
        return { 
          url: result.images[0].url, 
          prompt 
        };
      } catch (error) {
        console.error('Error generating individual image:', error);
        throw error;
      }
    });

    const images = await Promise.all(imagePromises);
    console.log(`Successfully generated ${images.length} images`);
    
    return { images };
  } catch (error) {
    console.error('Error in handleImagePromptGeneration:', error);
    throw error;
  }
}