
import { BusinessIdea, TargetAudience, MarketingCampaign } from '../Types.ts';
import { generateWithReplicate } from './utils/replicateUtils.ts';

const safeJSONParse = (str: string) => {
  try {
    const cleaned = str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
                      .replace(/\n/g, ' ')
                      .trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON Parse Error:', error);
    console.log('Problematic string:', str);
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
};

const AD_FORMATS = [
  { width: 1200, height: 628, label: "Landscape (1.91:1)" },
  { width: 1080, height: 1080, label: "Square (1:1)" },
  { width: 1080, height: 1920, label: "Story (9:16)" }
];

export async function generateImagePrompts(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign?: MarketingCampaign
) {
  const audiencePainPoints = targetAudience.painPoints || [];
  const deepPainPoints = targetAudience.audienceAnalysis?.deepPainPoints || [];
  const allPainPoints = [...new Set([...audiencePainPoints, ...deepPainPoints])];

  const prompt = `Generate creative image prompt for marketing visual based on this business and target audience:

Business:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify({ ...targetAudience, painPoints: allPainPoints }, null, 2)}

${campaign ? `Campaign Details:
${JSON.stringify(campaign, null, 2)}` : ''}

Key Pain Points to Address:
${allPainPoints.map(point => `- ${point}`).join('\n')}

Create 1 image prompt that:
1. Visually represents the value proposition
2. Connects emotionally with the target audience by addressing their pain points
3. Is detailed enough for high-quality image generation
4. Follows professional advertising best practices

Return ONLY a valid JSON array with exactly 1 item in this format:
[
  {
    "prompt": "detailed_image_prompt"
  }
]`;

  try {
    console.log('Generating image prompts with:', { 
      businessIdea, 
      targetAudience, 
      campaign,
      combinedPainPoints: allPainPoints 
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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

    const generatedPrompts = safeJSONParse(data.choices[0].message.content);
    console.log('Generated prompts:', generatedPrompts);

    if (!Array.isArray(generatedPrompts) || generatedPrompts.length === 0) {
      throw new Error('Invalid prompts format: Expected non-empty array');
    }

    // Generate one high-quality image in the largest format
    console.log('Generating master image...');
    const masterImageUrl = await generateWithReplicate(generatedPrompts[0].prompt, {
      width: 1200,
      height: 1200,
    });

    // Create array of images with different sizes but same URL
    const images = AD_FORMATS.map((format) => ({
      url: masterImageUrl,
      prompt: generatedPrompts[0].prompt,
      width: format.width,
      height: format.height,
      label: format.label
    }));

    console.log('Successfully generated images:', images);
    return { images };

  } catch (error) {
    console.error('Error in image prompt generation:', error);
    throw error;
  }
}
