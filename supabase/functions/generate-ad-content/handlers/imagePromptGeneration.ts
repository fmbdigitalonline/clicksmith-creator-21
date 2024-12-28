import Replicate from 'https://esm.sh/replicate@0.25.1';
import { corsHeaders } from '../../_shared/cors.ts';
import { sanitizePrompt, transformPrompt, validateBusinessContext } from './utils/promptUtils.ts';
import { generateWithReplicate } from './utils/replicateUtils.ts';
import { buildBasePrompt } from './utils/promptBuilder.ts';

interface BusinessIdea {
  description: string;
  valueProposition: string;
}

interface TargetAudience {
  name: string;
  description: string;
}

interface MarketingCampaign {
  hooks: Array<{
    text: string;
    description: string;
  }>;
  format: {
    format: string;
    dimensions: {
      width: number;
      height: number;
    };
    aspectRatio: string;
    description: string;
  };
}

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

    const basePrompt = buildBasePrompt(businessIdea, targetAudience, campaign);
    console.log('Base prompt generated:', basePrompt);

    // Generate prompts based on each selected hook with fallback variations
    const prompts = campaign.hooks.map(hook => {
      const hookPrompt = `Create a hyper-realistic commercial photograph for a professional advertising campaign. The photograph should represent: "${hook.description}"

STRICT REQUIREMENTS:
- Must be an actual photograph, absolutely NO illustrations, drawings, or artificial-looking images
- Ultra-realistic, professional commercial photography quality
- Natural, studio-quality lighting with proper shadows and highlights
- Crystal clear focus and professional camera quality
- Real human subjects (when applicable) in authentic business settings
- Real products and environments (no CGI or artificial elements)
- Composition following rule of thirds and professional photography principles
- Color grading matching high-end advertising campaigns
- Depth of field appropriate for commercial photography

Business Context: ${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}
Target Audience: ${targetAudience.description}

Additional Photography Specifications:
- Use professional DSLR camera quality
- Shoot in RAW format equivalent
- Maintain perfect exposure
- Ensure proper white balance
- Include subtle bokeh effects where appropriate
- Maintain sharp focus on key subjects
- Use professional color grading
- Include natural environmental lighting`;
      return sanitizePrompt(hookPrompt);
    });

    // If we have less than 6 prompts, add some variations
    while (prompts.length < 6) {
      const randomHook = campaign.hooks[Math.floor(Math.random() * campaign.hooks.length)];
      const variationPrompt = `Create a different ultra-realistic commercial photograph focusing on: "${randomHook.description}".
MUST BE:
- A real photograph, not an illustration or digital art
- Professional commercial photography quality
- Natural studio lighting
- Real people and real environments
- Sharp focus and high resolution

Business Context: ${businessIdea.description}
Target Audience: ${targetAudience.description}`;
      prompts.push(sanitizePrompt(variationPrompt));
    }

    console.log('Starting image generation with validated prompts:', prompts);

    // Generate all images in parallel with enhanced retry logic
    const imagePromises = prompts.map(async (prompt, index) => {
      const maxRetries = 3;
      let attempt = 0;
      
      while (attempt < maxRetries) {
        try {
          console.log(`Attempting to generate image ${index + 1}, attempt ${attempt + 1}`);
          
          const transformedPrompt = transformPrompt(prompt, attempt);
          console.log(`Using transformed prompt: ${transformedPrompt}`);
          
          const imageUrl = await generateWithReplicate(
            replicate,
            transformedPrompt,
            campaign.format.dimensions
          );

          console.log(`Successfully generated image ${index + 1} with URL:`, imageUrl);
          
          return {
            url: imageUrl,
            prompt: transformedPrompt,
          };
        } catch (error) {
          attempt++;
          console.error(`Error generating image ${index + 1}, attempt ${attempt}:`, error);
          
          if (attempt === maxRetries) {
            throw new Error('Failed to generate appropriate business image after multiple attempts. Please try again with a different business context.');
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
      throw new Error('Failed to generate appropriate business images. Please try adjusting your business description.');
    }
  } catch (error) {
    console.error('Error in handleImagePromptGeneration:', error);
    throw error;
  }
}