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

    // Initialize FAL client
    const falKeyId = Deno.env.get('FAL_KEY_ID');
    const falKey = Deno.env.get('FAL_KEY');
    
    if (!falKeyId || !falKey) {
      console.error('FAL AI credentials missing');
      throw new Error('Image generation service credentials not configured');
    }

    console.log('Configuring FAL AI client with credentials');
    fal.config({
      credentials: `${falKeyId}:${falKey}`,
    });

    console.log('FAL AI client configured successfully');

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
        const result = await fal.subscribe('fal-ai/flux-pro/v1/depth', {
          input: {
            prompt,
            negative_prompt: "text, watermark, logo, low quality, blurry, distorted",
            num_inference_steps: 50,
            seed: Math.floor(Math.random() * 1000000),
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              update.logs.map((log) => log.message).forEach(console.log);
            }
          },
        });

        if (!result?.images?.[0]?.url) {
          throw new Error(`Failed to generate image ${index + 1}`);
        }

        console.log(`Successfully generated image ${index + 1}`);
        
        return {
          url: result.images[0].url,
          prompt: prompt,
          requestId: result.requestId
        };
      } catch (error) {
        console.error(`Error generating image ${index + 1}:`, error);
        if (error.message.includes('Unauthorized')) {
          throw new Error('Failed to authenticate with image generation service. Please check credentials.');
        }
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