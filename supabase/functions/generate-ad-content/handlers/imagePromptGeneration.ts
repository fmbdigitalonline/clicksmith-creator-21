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

export async function handleImagePromptGeneration(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign: MarketingCampaign,
  openAIApiKey: string
) {
  console.log('Starting image prompt generation with Replicate...');
  
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
- Strictly business-focused content
- Safe for work, professional content only
- Conservative and appropriate for all audiences
- No text or typography elements
- Focus on professional business imagery
`;

  const strongNegativePrompt = "text, words, letters, numbers, symbols, watermarks, logos, labels, signs, writing, typography, fonts, characters, alphabets, digits, punctuation marks, nsfw, nudity, violence, gore, weapons, drugs, inappropriate content, offensive content, controversial content, suggestive content, unsafe content, adult content, explicit content";

  try {
    // Generate prompts based on each selected hook
    const prompts = campaign.hooks.map(hook => {
      return `${basePrompt}\nCreate a purely business-focused visual representation that captures this message: "${hook.description}" using only professional business imagery.`;
    });

    // If we have less than 6 prompts, add some variations
    while (prompts.length < 6) {
      const randomHook = campaign.hooks[Math.floor(Math.random() * campaign.hooks.length)];
      prompts.push(
        `${basePrompt}\nCreate an alternative business-appropriate visual interpretation focusing on: "${randomHook.description}" using only professional imagery.`
      );
    }

    console.log('Generating images with prompts:', prompts);

    // Generate all images in parallel with retry logic
    const imagePromises = prompts.map(async (prompt, index) => {
      const maxRetries = 3;
      let attempt = 0;
      
      while (attempt < maxRetries) {
        try {
          console.log(`Attempting to generate image ${index + 1}, attempt ${attempt + 1}`);
          
          const prediction = await replicate.predictions.create({
            version: "b0c6eeefcefc40a997fa1787500782b6a7a9a99ae40f79d71e2c83daf7be5d13",
            input: {
              prompt,
              negative_prompt: strongNegativePrompt,
              width: campaign.format.dimensions.width,
              height: campaign.format.dimensions.height,
              aspect_ratio: "16:9",
              style_type: "None",
              magic_prompt_option: "Auto"
            }
          });

          // Wait for the prediction to complete
          const result = await replicate.wait(prediction);

          if (!result?.output) {
            throw new Error('No output received from image generation');
          }

          console.log(`Successfully generated image ${index + 1}`);
          
          return {
            url: result.output,
            prompt: prompt,
          };
        } catch (error) {
          attempt++;
          console.error(`Error generating image ${index + 1}, attempt ${attempt}:`, error);
          
          if (attempt === maxRetries) {
            throw new Error('Failed to generate appropriate business image after multiple attempts. Please try again with a different business context.');
          }
          
          // Wait before retrying with increasing delay
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
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