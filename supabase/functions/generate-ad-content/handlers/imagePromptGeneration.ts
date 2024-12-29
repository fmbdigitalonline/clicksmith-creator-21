import { BusinessIdea, TargetAudience, MarketingCampaign } from '../Types.ts';
import { generateWithLeonardo } from './utils/leonardoUtils.ts';

export async function generateImagePrompts(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign?: MarketingCampaign
) {
  const prompt = `Generate creative image prompts for marketing visuals based on this business and target audience:

Business:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify(targetAudience, null, 2)}

${campaign ? `Campaign Details:
${JSON.stringify(campaign, null, 2)}` : ''}

Create 4 different image prompts that:
1. Visually represent the value proposition
2. Connect emotionally with the target audience
3. Are detailed enough for high-quality image generation
4. Follow professional advertising best practices

Return ONLY a valid JSON array with exactly 4 items in this format:
[
  {
    "prompt": "detailed_image_prompt"
  }
]`;

  try {
    console.log('Generating image prompts with:', { businessIdea, targetAudience, campaign });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert at creating detailed image prompts for marketing visuals that align with business goals and target audiences.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedPrompts = JSON.parse(data.choices[0].message.content);

    // Generate images using Leonardo AI
    const imagePromises = generatedPrompts.map(async (item: any) => {
      const imageUrl = await generateWithLeonardo(item.prompt);
      return {
        url: imageUrl,
        prompt: item.prompt,
      };
    });

    const images = await Promise.all(imagePromises);
    console.log('Successfully generated images:', images);
    
    return { images };
  } catch (error) {
    console.error('Error in image prompt generation:', error);
    throw error;
  }
}