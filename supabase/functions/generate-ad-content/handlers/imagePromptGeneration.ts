import { BusinessIdea, TargetAudience, MarketingCampaign } from '../Types.ts';
import { generateWithReplicate } from './utils/replicateUtils.ts';

interface ImageFormat {
  width: number;
  height: number;
  label: string;
}

const DEFAULT_FORMAT = {
  width: 1200,
  height: 628,
  label: "Facebook Feed"
};

const IMAGE_FORMATS = {
  landscape: [
    { width: 1200, height: 628, label: "Facebook Feed" },
    { width: 1080, height: 566, label: "Facebook Link" },
    { width: 1080, height: 1080, label: "Facebook Square" }
  ],
  portrait: [
    { width: 1080, height: 1350, label: "Instagram Portrait" },
    { width: 1080, height: 1920, label: "Instagram Story" }
  ],
  square: [
    { width: 1080, height: 1080, label: "Instagram Square" },
    { width: 1080, height: 1080, label: "Facebook Square" }
  ]
};

export async function generateImagePrompts(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign?: MarketingCampaign
): Promise<Array<{ url: string; prompt: string; width: number; height: number; label: string }>> {
  try {
    console.log('Generating image prompts with params:', { businessIdea, targetAudience, campaign });
    
    const audiencePainPoints = targetAudience.painPoints || [];
    const deepPainPoints = targetAudience.audienceAnalysis?.deepPainPoints || [];
    const allPainPoints = [...new Set([...audiencePainPoints, ...deepPainPoints])];

    const prompt = `Generate a highly detailed, photorealistic commercial advertising image prompt. The image must be indistinguishable from a professional DSLR photograph, with absolutely no artistic interpretations, illustrations, or cartoon elements.

Business Context:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify(targetAudience, null, 2)}

Marketing Campaign:
${campaign ? JSON.stringify(campaign, null, 2) : 'No specific campaign provided'}

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

    console.log('Sending prompt to OpenAI:', prompt);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert at creating detailed prompts for photorealistic commercial photography. You NEVER include artistic or cartoon elements in your prompts. You focus solely on professional, high-end commercial photography aesthetics.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    const generatedPrompts = JSON.parse(data.choices[0].message.content);
    console.log('Parsed prompts:', generatedPrompts);

    if (!Array.isArray(generatedPrompts) || !generatedPrompts[0]?.prompt || typeof generatedPrompts[0].prompt !== 'string') {
      throw new Error('Invalid prompt format: Expected string prompt');
    }

    const enhancedPrompt = `${generatedPrompts[0].prompt} 
    Style requirements: ultra realistic, professional DSLR photo, commercial photography, absolutely no cartoon elements, no illustrations, photorealistic, high-end advertising, studio lighting, 8k quality`;

    // Determine which formats to generate based on campaign settings or default to landscape
    const formatType = campaign?.format || 'landscape';
    const formatsToGenerate = IMAGE_FORMATS[formatType as keyof typeof IMAGE_FORMATS] || [DEFAULT_FORMAT];

    // Generate images for all required formats
    const generatedImages = await Promise.all(
      formatsToGenerate.map(async (format) => {
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
      })
    );

    console.log('Generated images:', generatedImages);
    return generatedImages;

  } catch (error) {
    console.error('Error in generateImagePrompts:', error);
    throw error;
  }
}