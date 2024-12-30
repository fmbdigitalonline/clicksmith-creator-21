import { BusinessIdea, TargetAudience, MarketingCampaign } from '../Types.ts';
import { generateWithReplicate } from './utils/replicateUtils.ts';
import { resizeImage } from './utils/imageResizing.ts';
import { supabase } from '../utils/supabaseClient.ts';

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

export async function generateImagePrompts(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign?: MarketingCampaign
) {
  try {
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

    console.log('Sending prompt to Replicate:', prompt);
    
    const response = await generateWithReplicate(prompt, { width: 1200, height: 628 });
    console.log('Raw Replicate response:', response);

    // Ensure we have a string response
    const promptText = typeof response === 'string' ? response : JSON.stringify(response);
    
    // Parse the response and ensure it's an array
    let parsedPrompts;
    try {
      parsedPrompts = safeJSONParse(promptText);
      if (!Array.isArray(parsedPrompts)) {
        parsedPrompts = [{ prompt: promptText }];
      }
    } catch (error) {
      console.warn('Failed to parse prompts, using raw response:', error);
      parsedPrompts = [{ prompt: promptText }];
    }

    console.log('Parsed prompts:', parsedPrompts);

    const images = await Promise.all(parsedPrompts.map(async (item: any) => {
      if (!item.prompt || typeof item.prompt !== 'string') {
        throw new Error('Invalid prompt format: Expected string prompt');
      }

      // Generate original image
      const originalUrl = await generateWithReplicate(item.prompt, { width: 1200, height: 628 });
      console.log('Generated original image URL:', originalUrl);
      
      // Generate resized variants
      const resizedUrls = await resizeImage(originalUrl);
      console.log('Generated resized variants:', resizedUrls);

      // Store image variants in database
      const { data: imageVariant, error } = await supabase
        .from('ad_image_variants')
        .insert({
          original_image_url: originalUrl,
          resized_image_urls: resizedUrls,
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing image variants:', error);
        throw error;
      }

      return {
        url: originalUrl,
        prompt: item.prompt,
        variants: resizedUrls,
        variantId: imageVariant.id
      };
    }));

    console.log('Final generated images:', images);
    return { images };
  } catch (error) {
    console.error('Error in image prompt generation:', error);
    throw error;
  }
}