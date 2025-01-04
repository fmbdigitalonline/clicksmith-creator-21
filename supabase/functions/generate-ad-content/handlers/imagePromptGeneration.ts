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

  const prompt = `Generate a highly detailed, photorealistic commercial advertising image prompt. The image must be indistinguishable from a professional DSLR photograph, with absolutely no artistic interpretations, illustrations, or cartoon elements.

Business Context:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify({ ...targetAudience, painPoints: allPainPoints }, null, 2)}

${campaign ? `Campaign Details:
${JSON.stringify(campaign, null, 2)}` : ''}

Key Pain Points to Address:
${allPainPoints.map(point => `- ${point}`).join('\n')}

Critical Requirements:
1. MUST be a photorealistic commercial photograph
2. NO cartoon styles, illustrations, or artistic interpretations
3. NO text overlays or graphics
4. Professional studio quality lighting and composition
5. High-end commercial photography aesthetic
6. Natural, realistic colors and textures
7. Clean, professional business environment
8. Absolutely NO AI-generated looking elements
9. Must follow professional advertising photography standards
10. Crystal clear focus and professional depth of field

Return ONLY a valid JSON array with exactly 1 item in this format:
[
  {
    "prompt": "detailed_photorealistic_image_prompt"
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
            content: 'You are an expert at creating detailed prompts for photorealistic commercial photography. You NEVER include artistic or cartoon elements in your prompts. You focus solely on professional, high-end commercial photography aesthetics.'
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

    // Generate images for each format
    const imagePromises = AD_FORMATS.map(async (format) => {
      if (!generatedPrompts[0].prompt || typeof generatedPrompts[0].prompt !== 'string') {
        throw new Error('Invalid prompt format: Expected string prompt');
      }

      const enhancedPrompt = `${generatedPrompts[0].prompt} 
      Style requirements: ultra realistic, professional DSLR photo, commercial photography, absolutely no cartoon elements, no illustrations, photorealistic, high-end advertising, studio lighting, 8k quality`;

      const imageUrl = await generateWithReplicate(enhancedPrompt, {
        width: format.width,
        height: format.height
      });

      return {
        url: imageUrl,
        prompt: enhancedPrompt,
        width: format.width,
        height: format.height,
        label: format.label
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