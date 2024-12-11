import { fal } from 'https://esm.sh/@fal-ai/client@1.2.1';
import { BusinessIdea, TargetAudience, MarketingCampaign } from '../types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function handleImagePromptGeneration(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign: MarketingCampaign,
  openAIApiKey: string
) {
  try {
    console.log('Starting image generation with FAL AI');
    
    // Initialize FAL client with credentials from environment
    const falKeyId = Deno.env.get('FAL_KEY_ID');
    const falKey = Deno.env.get('FAL_KEY');
    
    if (!falKeyId || !falKey) {
      throw new Error('FAL AI credentials not configured');
    }

    fal.config({
      credentials: `${falKeyId}:${falKey}`,
    });

    console.log('FAL AI client configured');

    // Generate 6 images in parallel
    const imagePromises = Array(6).fill(null).map(async (_, index) => {
      const hook = campaign.angles[index % campaign.angles.length];
      
      const prompt = `Professional Facebook ad showing: ${businessIdea.description}. 
        Style: ${hook.description}. Message: ${hook.hook}. 
        Target audience: ${targetAudience.demographics}. 
        High quality, professional advertising photography, clean composition, 
        well-lit, modern design, social media optimized`;

      console.log(`Generating image ${index + 1} with prompt:`, prompt);

      try {
        const result = await fal.subscribe('fal-ai/fast-sdxl', {
          input: {
            prompt,
            negative_prompt: "text, watermark, logo, low quality, blurry, distorted",
            num_inference_steps: 50,
            seed: Math.floor(Math.random() * 1000000),
          },
        });

        console.log(`Successfully generated image ${index + 1}`);
        
        return {
          url: result.images[0].url,
          prompt: prompt,
        };
      } catch (error) {
        console.error(`Error generating image ${index + 1}:`, error);
        throw error;
      }
    });

    const images = await Promise.all(imagePromises);
    console.log('Successfully generated all images');

    return {
      images,
      headers: corsHeaders,
    };
  } catch (error) {
    console.error('Error in handleImagePromptGeneration:', error);
    throw error;
  }
}