import { BusinessIdea, TargetAudience, MarketingCampaign } from '../types.ts';
import Replicate from 'npm:replicate';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function generateImages(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign: MarketingCampaign
) {
  console.log('Starting image generation process...');
  
  try {
    const replicate = new Replicate({
      auth: Deno.env.get('REPLICATE_API_TOKEN'),
    });

    if (!Deno.env.get('REPLICATE_API_TOKEN')) {
      throw new Error('REPLICATE_API_TOKEN is not set');
    }

    // Create prompts based on business and campaign details
    const prompts = [
      `Create a compelling advertisement for ${businessIdea.description}. The ad should showcase ${businessIdea.valueProposition} and appeal to ${targetAudience.demographics}. Style: Modern, professional Facebook ad.`,
      `Design a promotional Facebook ad for ${businessIdea.description} targeting ${targetAudience.painPoints.join(', ')}. Focus on: ${businessIdea.valueProposition}. Style: Clean, engaging social media ad.`,
      `Generate an engaging Facebook ad visual that resonates with ${targetAudience.demographics}. Product: ${businessIdea.description}. Key message: ${businessIdea.valueProposition}. Style: Contemporary social media advertisement.`,
    ];

    console.log('Generated prompts:', prompts);

    // Generate images in parallel
    const imagePromises = prompts.map(async (prompt) => {
      console.log('Starting generation for prompt:', prompt);
      
      const output = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            prompt,
            width: 1024,
            height: 1024,
            num_outputs: 1,
            scheduler: "K_EULER",
            num_inference_steps: 50,
            guidance_scale: 7.5,
            negative_prompt: "text, watermark, logo, label, poor quality, blurry, distorted"
          }
        }
      );

      console.log('Generated image URL:', output);
      
      return {
        url: Array.isArray(output) ? output[0] : output,
        prompt: prompt,
        metadata: {
          model: "sdxl",
          provider: "replicate"
        }
      };
    });

    const images = await Promise.all(imagePromises);
    console.log('Successfully generated all images');
    
    return images;
  } catch (error) {
    console.error('Error generating images:', error);
    throw new Error(`Failed to generate images: ${error.message}`);
  }
}