import { BusinessIdea, TargetAudience, MarketingCampaign } from '../types.ts';
import Replicate from 'npm:replicate';

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

    // Create prompts based on business and campaign details
    const prompts = [
      `Create a compelling advertisement for ${businessIdea.name}. The ad should showcase ${businessIdea.description} and appeal to ${targetAudience.demographics}. Campaign focus: ${campaign.objective}`,
      `Design a promotional image for ${businessIdea.name} targeting ${targetAudience.interests}. Highlight ${campaign.uniqueSellingPoint}`,
      `Generate an engaging ad visual for ${businessIdea.name} that resonates with ${targetAudience.demographics}. Emphasize ${campaign.callToAction}`,
    ];

    console.log('Generated prompts:', prompts);

    // Generate images in parallel
    const imagePromises = prompts.map(async (prompt) => {
      console.log('Starting generation for prompt:', prompt);
      
      const output = await replicate.run(
        "black-forest-labs/flux-1.1-pro-ultra",
        {
          input: {
            prompt,
            aspect_ratio: "3:2",
            num_inference_steps: 50,
            guidance_scale: 7.5,
          }
        }
      );

      console.log('Generated image URL:', output);
      
      return {
        url: output,
        prompt: prompt,
        metadata: {
          model: "flux-1.1-pro-ultra",
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