import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fal } from "npm:@fal-ai/serverless-client";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function handleImagePromptGeneration(businessIdea: any, targetAudience: any, campaign: any) {
  console.log('Starting image generation with fal.ai...');
  console.log('Inputs:', { businessIdea, targetAudience, campaign });

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
    const falKeyId = Deno.env.get('FAL_KEY_ID');
    const falApiKey = Deno.env.get('FAL_API_KEY');

    if (!falKeyId || !falApiKey) {
      throw new Error('FAL.AI credentials not found');
    }

    // Set up fal.ai credentials
    fal.config({
      credentials: {
        keyId: falKeyId,
        keySecret: falApiKey,
      },
    });

    console.log('Configured fal.ai client, generating images...');

    // Generate 6 images in parallel
    const imagePromises = Array(6).fill(null).map(async () => {
      try {
        console.log('Starting individual image generation...');
        const result = await fal.subscribe('fal-ai/sana', {
          input: {
            prompt: prompt,
            negative_prompt: "text, watermark, low quality, blurry, distorted",
            image_size: "square",
            num_inference_steps: 50,
            guidance_scale: 7.5,
            enable_safety_checks: true,
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              update.logs?.map((log) => log.message).forEach(console.log);
            }
          },
        });

        if (!result?.images?.[0]?.url) {
          throw new Error('No image URL in response');
        }

        console.log('Successfully generated image:', result.images[0].url);
        return { 
          url: result.images[0].url, 
          prompt 
        };
      } catch (error) {
        console.error('Error generating individual image:', error);
        throw new Error(`Failed to generate image: ${error.message}`);
      }
    });

    const images = await Promise.all(imagePromises);
    console.log(`Successfully generated ${images.length} images`);
    
    return { images };
  } catch (error) {
    console.error('Error in handleImagePromptGeneration:', error);
    throw new Error(`Image generation failed: ${error.message}`);
  }
}