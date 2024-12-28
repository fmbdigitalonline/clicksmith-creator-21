import Replicate from 'https://esm.sh/replicate@0.25.1';
import { corsHeaders } from '../../_shared/cors.ts';
import { validateBusinessContext } from './utils/promptUtils.ts';
import { generateWithReplicate } from './utils/replicateUtils.ts';
import { generatePrompts } from './utils/promptGeneration.ts';
import { BusinessIdea, TargetAudience, MarketingCampaign } from './types';

export async function handleImagePromptGeneration(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign: MarketingCampaign,
  openAIApiKey: string
) {
  console.log('Starting image prompt generation with business context:', {
    businessType: businessIdea.description,
    audience: targetAudience.name,
    campaignType: campaign.hooks[0]?.description
  });
  
  try {
    validateBusinessContext(businessIdea);
    
    const replicateApiToken = Deno.env.get('REPLICATE_API_TOKEN');
    if (!replicateApiToken) {
      throw new Error('REPLICATE_API_TOKEN is required');
    }

    const replicate = new Replicate({
      auth: replicateApiToken,
    });

    const prompts = generatePrompts(businessIdea, targetAudience, campaign);
    console.log('Generated prompts:', prompts);

    // Generate all images in parallel with enhanced retry logic
    const imagePromises = prompts.map(async (prompt, index) => {
      const maxRetries = 3;
      let attempt = 0;
      
      while (attempt < maxRetries) {
        try {
          console.log(`Attempting to generate image ${index + 1}, attempt ${attempt + 1}`);
          
          const imageUrl = await generateWithReplicate(
            replicate,
            prompt,
            campaign.format.dimensions
          );

          console.log(`Successfully generated image ${index + 1} with URL:`, imageUrl);
          
          return {
            url: imageUrl,
            prompt,
          };
        } catch (error) {
          attempt++;
          console.error(`Error generating image ${index + 1}, attempt ${attempt}:`, error);
          
          if (attempt === maxRetries) {
            throw new Error('Failed to generate appropriate business image after multiple attempts.');
          }
          
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    });

    try {
      const images = await Promise.all(imagePromises);
      console.log(`Successfully generated ${images.length} images`);
      
      return { images };
    } catch (error) {
      console.error('Error in image generation batch:', error);
      throw new Error('Failed to generate appropriate business images.');
    }
  } catch (error) {
    console.error('Error in handleImagePromptGeneration:', error);
    throw error;
  }
}