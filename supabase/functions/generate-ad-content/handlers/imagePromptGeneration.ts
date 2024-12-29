import { BusinessIdea, TargetAudience, MarketingCampaign } from '../Types.ts';
import { generateWithReplicate } from './utils/replicateUtils.ts';

// Helper function to validate and parse JSON safely
const safeJSONParse = (str: string) => {
  try {
    // First, ensure the string is properly formatted
    const cleaned = str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
                      .replace(/\n/g, ' ')
                      .trim();
    
    // Try to parse the cleaned string
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON Parse Error:', error);
    console.log('Problematic string:', str);
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
};

export async function generateImagePrompts(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign?: MarketingCampaign
) {
  const prompt = `Generate creative image prompt for marketing visual based on this business and target audience:

Business:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify(targetAudience, null, 2)}

${campaign ? `Campaign Details:
${JSON.stringify(campaign, null, 2)}` : ''}

Create 1 image prompt that:
1. Visually represents the value proposition
2. Connects emotionally with the target audience
3. Is detailed enough for high-quality image generation
4. Follows professional advertising best practices

Return ONLY a valid JSON array with exactly 1 item in this format:
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
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Parse and validate the response content
    const generatedPrompts = safeJSONParse(data.choices[0].message.content);
    console.log('Generated prompts:', generatedPrompts);

    if (!Array.isArray(generatedPrompts) || generatedPrompts.length === 0) {
      throw new Error('Invalid prompts format: Expected non-empty array');
    }

    // Generate image using Replicate
    const imagePromises = generatedPrompts.map(async (item: any) => {
      if (!item.prompt || typeof item.prompt !== 'string') {
        throw new Error('Invalid prompt format: Expected string prompt');
      }

      const imageUrl = await generateWithReplicate(item.prompt, { width: 1024, height: 1024 });
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