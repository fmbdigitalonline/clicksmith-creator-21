
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
  { width: 1080, height: 1080, label: "Square (1:1)" }
];

export async function generateImagePrompts(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign?: MarketingCampaign
) {
  const audiencePainPoints = targetAudience.painPoints || [];
  const deepPainPoints = targetAudience.audienceAnalysis?.deepPainPoints || [];
  const allPainPoints = [...new Set([...audiencePainPoints, ...deepPainPoints])];

  console.log('Starting image generation process with:', {
    businessName: businessIdea.description,
    audienceSize: allPainPoints.length,
    campaignPresent: !!campaign
  });

  const prompt = `Generate creative image prompt for marketing visual based on this business and target audience:

Business:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify({ ...targetAudience, painPoints: allPainPoints }, null, 2)}

${campaign ? `Campaign Details:
${JSON.stringify(campaign, null, 2)}` : ''}

Key Pain Points to Address:
${allPainPoints.map(point => `- ${point}`).join('\n')}

Create 3 DIFFERENT image prompts that:
1. Each visually represents the value proposition in a unique way
2. Each connects emotionally with the target audience by addressing different pain points
3. Are detailed enough for high-quality image generation
4. Follow professional advertising best practices

Return ONLY a valid JSON array with exactly 3 items in this format:
[
  {
    "prompt": "detailed_image_prompt_1"
  },
  {
    "prompt": "detailed_image_prompt_2"
  },
  {
    "prompt": "detailed_image_prompt_3"
  }
]`;

  try {
    console.log('Requesting prompts from OpenAI...');

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
            content: 'You are an expert at creating diverse and unique image prompts for marketing visuals that align with business goals and target audiences. Each prompt should be distinctly different from the others.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received:', {
      status: response.status,
      promptCount: data.choices?.[0]?.message?.content ? 'present' : 'missing'
    });

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    const generatedPrompts = safeJSONParse(data.choices[0].message.content);
    console.log('Successfully parsed prompts:', {
      count: generatedPrompts.length,
      prompts: generatedPrompts.map((p: any) => p.prompt.substring(0, 50) + '...')
    });

    if (!Array.isArray(generatedPrompts) || generatedPrompts.length !== 3) {
      throw new Error('Invalid prompts format: Expected array with exactly 3 items');
    }

    // Generate three different high-quality master images
    console.log('Starting master images generation...');
    const masterImagePromises = generatedPrompts.map((promptData, index) => {
      console.log(`Generating image ${index + 1}/3 with prompt: ${promptData.prompt.substring(0, 50)}...`);
      return generateWithReplicate(promptData.prompt, {
        width: 1200,
        height: 1200,
      });
    });

    const masterImageUrls = await Promise.all(masterImagePromises);
    console.log('Master images generated successfully:', {
      count: masterImageUrls.length,
      urls: masterImageUrls.map(url => url.split('/').pop())
    });

    // Create array of images with different sizes for each master image
    const images = masterImageUrls.flatMap((imageUrl, index) => {
      console.log(`Creating format variations for image ${index + 1}...`);
      return AD_FORMATS.map((format) => ({
        url: imageUrl,
        prompt: generatedPrompts[index].prompt,
        width: format.width,
        height: format.height,
        label: format.label,
        imageSet: index + 1 // Add this to help track which image set this belongs to
      }));
    });

    console.log('Successfully generated all image variations:', {
      totalVariations: images.length,
      uniqueImages: new Set(images.map(img => img.url)).size,
      formatTypes: AD_FORMATS.map(f => f.label)
    });

    return { images };

  } catch (error) {
    console.error('Error in image prompt generation:', error);
    throw error;
  }
}
