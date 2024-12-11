import { Replicate } from 'https://esm.sh/replicate@0.25.1';
import { BusinessIdea, TargetAudience, MarketingCampaign } from '../types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function handleImagePromptGeneration(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign: MarketingCampaign,
  apiKey: string
) {
  try {
    console.log('Starting image generation with inputs:', { businessIdea, targetAudience, campaign });
    
    const replicate = new Replicate({
      auth: Deno.env.get("REPLICATE_API_TOKEN"),
    });

    // Create a detailed prompt based on the business and campaign details
    const prompt = `Create a Facebook ad image for ${businessIdea.name}. 
    The business is about ${businessIdea.description}. 
    The target audience is ${targetAudience.description}. 
    Campaign goal: ${campaign.objective}. 
    Style: Professional, modern, and engaging Facebook ad.
    Make it visually appealing and suitable for social media advertising.`;

    console.log('Generated prompt:', prompt);

    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: prompt,
          negative_prompt: "text, watermark, low quality, blurry",
          width: 1200,
          height: 628,
          num_outputs: 4
        }
      }
    );

    console.log('Generated images:', output);

    // Transform the output into the expected format
    const images = Array.isArray(output) ? output.map((url: string) => ({
      url,
      width: 1200,
      height: 628
    })) : [];

    return {
      images
    };
  } catch (error) {
    console.error('Error in image generation:', error);
    throw new Error(`Failed to generate images: ${error.message}`);
  }
}