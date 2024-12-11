import Replicate from 'replicate';
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
    console.log('Starting image generation with inputs:', { businessIdea, targetAudience, campaign });
    
    // Validate inputs
    if (!businessIdea?.description) {
      throw new Error('Business idea description is required');
    }
    if (!targetAudience?.demographics) {
      throw new Error('Target audience demographics are required');
    }
    if (!campaign?.angles || !Array.isArray(campaign.angles) || campaign.angles.length === 0) {
      throw new Error('Campaign angles are required and must be a non-empty array');
    }

    // Initialize Replicate client
    const replicateApiKey = Deno.env.get('REPLICATE_API_TOKEN');
    
    if (!replicateApiKey) {
      console.error('Replicate API token missing');
      throw new Error('Image generation service credentials not configured');
    }

    const replicate = new Replicate({
      auth: replicateApiKey,
    });

    console.log('Replicate client configured successfully');

    // Generate images in parallel
    const imagePromises = Array(6).fill(null).map(async (_, index) => {
      const angleIndex = index % campaign.angles.length;
      const angle = campaign.angles[angleIndex];
      
      if (!angle?.description || !angle?.hook) {
        throw new Error(`Invalid campaign angle at index ${angleIndex}`);
      }

      const prompt = `Professional Facebook ad showing: ${businessIdea.description}. 
        Style: ${angle.description}. Message: ${angle.hook}. 
        Target audience: ${targetAudience.demographics}. 
        High quality, professional advertising photography, clean composition, 
        well-lit, modern design, social media optimized`;

      console.log(`Generating image ${index + 1} with prompt:`, prompt);

      try {
        const output = await replicate.run(
          "black-forest-labs/flux-1.1-pro-ultra",
          {
            input: {
              prompt: prompt,
              negative_prompt: "text, watermark, logo, low quality, blurry, distorted",
              aspect_ratio: "3:2",
              num_inference_steps: 50,
              seed: Math.floor(Math.random() * 1000000),
            }
          }
        );

        if (!output || !Array.isArray(output) || output.length === 0) {
          throw new Error(`Failed to generate image ${index + 1}`);
        }

        console.log(`Successfully generated image ${index + 1}`);
        
        return {
          url: output[0],
          prompt: prompt,
          requestId: `replicate-${Date.now()}-${index}`
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