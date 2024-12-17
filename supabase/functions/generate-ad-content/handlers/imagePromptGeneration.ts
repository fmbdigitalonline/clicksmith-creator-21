import Replicate from 'https://esm.sh/replicate@0.25.1';

interface BusinessIdea {
  description: string;
  valueProposition: string;
}

interface TargetAudience {
  name: string;
  description: string;
  demographics: string;
  painPoints: string[];
  icp: string;
  coreMessage: string;
  positioning: string;
  marketingAngle: string;
  messagingApproach: string;
  marketingChannels: string[];
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function sanitizePrompt(prompt: string): string {
  // Remove any potentially problematic content
  const sanitized = prompt
    .replace(/[^\w\s,.!?()-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Ensure minimum length
  if (sanitized.length < 20) {
    throw new Error('Prompt is too short after sanitization');
  }
  
  return sanitized;
}

function validateBusinessContext(businessIdea: BusinessIdea): void {
  if (!businessIdea.description || businessIdea.description.length < 10) {
    throw new Error('Business description is too vague or missing');
  }
  
  if (!businessIdea.valueProposition || businessIdea.valueProposition.length < 10) {
    throw new Error('Value proposition is too vague or missing');
  }
}

function transformPrompt(prompt: string, attempt: number): string {
  const variations = [
    (p: string) => `Professional business image showing: ${p}`,
    (p: string) => `Corporate style visualization of: ${p}`,
    (p: string) => `Modern business representation depicting: ${p}`,
    (p: string) => `Clean, minimal business scene showing: ${p}`,
  ];
  
  // Use different variations based on retry attempt
  const variationIndex = attempt % variations.length;
  return variations[variationIndex](prompt);
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

    const basePrompt = `Create a professional, business-appropriate Facebook advertisement image that represents:
${campaign.hooks.map(hook => hook.description).join('\n')}

Business Context:
${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}

Target Audience:
${targetAudience.name}
${targetAudience.description}

Style requirements:
- Professional corporate photography style
- Clean, minimal composition
- Bright, well-lit scenes
- Business-appropriate attire and settings
- Professional office or business environment
- Maximum 2 people per image
- High-end commercial look
- Business-focused content
- Safe for work, professional content only
- Conservative and appropriate for all audiences
- No text or typography elements
- Focus on professional business imagery
`;

    const strongNegativePrompt = "text, words, letters, numbers, symbols, watermarks, logos, labels, signs, writing, typography, fonts, characters, alphabets, digits, punctuation marks, nsfw, nudity, violence, gore, weapons, drugs, inappropriate content, offensive content, controversial content, suggestive content, unsafe content, adult content, explicit content";

    // Generate prompts based on each selected hook with fallback variations
    const prompts = campaign.hooks.map(hook => {
      const baseHookPrompt = `${basePrompt}\nCreate a purely business-focused visual representation that captures this message: "${hook.description}" using only professional business imagery.`;
      return sanitizePrompt(baseHookPrompt);
    });

    // If we have less than 6 prompts, add some variations
    while (prompts.length < 6) {
      const randomHook = campaign.hooks[Math.floor(Math.random() * campaign.hooks.length)];
      const variationPrompt = `${basePrompt}\nCreate an alternative business-appropriate visual interpretation focusing on: "${randomHook.description}" using only professional imagery.`;
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
          
          // Transform prompt based on retry attempt
          const transformedPrompt = transformPrompt(prompt, attempt);
          console.log(`Using transformed prompt: ${transformedPrompt}`);
          
          const prediction = await replicate.predictions.create({
            version: "b0c6eeefcefc40a997fa1787500782b6a7a9a99ae40f79d71e2c83daf7be5d13",
            input: {
              prompt: transformedPrompt,
              negative_prompt: strongNegativePrompt,
              width: campaign.format.dimensions.width,
              height: campaign.format.dimensions.height,
              scheduler: "K_EULER",
              num_inference_steps: 50,
              guidance_scale: 7.5,
              num_outputs: 1,
              seed: Math.floor(Math.random() * 1000000)
            }
          });

          console.log(`Prediction created for image ${index + 1}:`, prediction);

          // Wait for the prediction to complete with timeout and status monitoring
          const maxWaitTime = 60000; // 60 seconds
          const startTime = Date.now();
          let result;
          let lastStatus = '';

          while (!result && Date.now() - startTime < maxWaitTime) {
            result = await replicate.predictions.get(prediction.id);
            
            if (result.status !== lastStatus) {
              console.log(`Image ${index + 1} status updated to: ${result.status}`);
              lastStatus = result.status;
            }
            
            if (result.status === "succeeded") {
              break;
            } else if (result.status === "failed") {
              throw new Error(`Prediction failed: ${result.error}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          if (!result || result.status !== "succeeded") {
            throw new Error('Image generation timed out or failed');
          }

          console.log(`Generation result for image ${index + 1}:`, result);

          if (!result.output) {
            console.error('No output in result:', result);
            throw new Error('No output received from image generation');
          }

          // Handle both string and array outputs
          const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
          
          if (!imageUrl) {
            console.error('No valid image URL in output:', result.output);
            throw new Error('No valid image URL in output');
          }

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
          
          // Wait before retrying with increasing delay
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