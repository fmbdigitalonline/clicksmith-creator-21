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

  const basePrompt = `Create a professional, safe-for-work Facebook ad image that visually represents this concept:
${campaign.hooks.map(hook => hook.description).join('\n')}

Business Context:
${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}

Target Audience:
${targetAudience.name}
${targetAudience.description}

Style requirements:
- Ultra-realistic, professional photography style
- Clean composition with plenty of empty space
- Absolutely NO text, words, letters, or symbols of any kind
- Vibrant, engaging colors
- Maximum 2 people per image
- High-end commercial look
- Perfect for Facebook ads
- Safe for work, professional business content only
- No controversial or sensitive content
- Appropriate for all audiences
`;

  const strongNegativePrompt = "text, words, letters, numbers, symbols, watermarks, logos, labels, signs, writing, typography, fonts, characters, alphabets, digits, punctuation marks, nsfw, nudity, violence, gore, weapons, drugs, inappropriate content, offensive content";

  try {
    // Generate prompts based on each selected hook
    const prompts = campaign.hooks.map(hook => {
      return `${basePrompt}\nCreate a purely visual representation that captures this message: "${hook.description}" using only imagery and emotional storytelling, with absolutely no text elements.`;
    });

    // If we have less than 6 prompts, add some variations
    while (prompts.length < 6) {
      const randomHook = campaign.hooks[Math.floor(Math.random() * campaign.hooks.length)];
      prompts.push(
        `${basePrompt}\nCreate an alternative visual interpretation focusing purely on the emotional impact of: "${randomHook.description}" using only imagery, no text or symbols.`
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
          const output = await replicate.run(
            "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
            {
              input: {
                prompt,
                negative_prompt: strongNegativePrompt,
                num_inference_steps: 4,
                guidance_scale: 7.5,
                width: campaign.format.dimensions.width,
                height: campaign.format.dimensions.height,
              }
            }
          );

          console.log(`Successfully generated image ${index + 1}`);
          
          return {
            url: output[0],
            prompt: prompt,
          };
        } catch (error) {
          attempt++;
          console.error(`Error generating image ${index + 1}, attempt ${attempt}:`, error);
          
          if (error.message?.includes('NSFW content detected') || attempt === maxRetries) {
            throw error;
          }
          
          // Wait before retrying
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
      if (error.message?.includes('NSFW content detected')) {
        throw new Error('NSFW content detected. Please try again with a different prompt or contact support if the issue persists.');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in handleImagePromptGeneration:', error);
    throw error;
  }
}