import { BusinessIdea, TargetAudience, MarketingCampaign } from '../types.ts';
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';

export async function handleCompleteAdGeneration(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign: MarketingCampaign,
  openAIApiKey: string
) {
  try {
    // Generate one main high-quality image using Hugging Face
    const imagePrompt = `Create a professional advertisement image for:
    ${businessIdea.description}
    Target audience: ${targetAudience.description}
    Style: Clean, professional, business-appropriate
    Requirements: High resolution, vibrant colors, clear focal point
    Minimum width: 1500px for responsive scaling`;

    const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'));
    
    const image = await hf.textToImage({
      inputs: imagePrompt,
      model: 'black-forest-labs/FLUX.1-schnell',
      parameters: {
        negative_prompt: "illustration, drawing, cartoon, anime, sketch, painting, digital art, rendered, artificial, fake",
      }
    });

    // Convert the blob to a base64 string
    const arrayBuffer = await image.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mainImage = {
      url: `data:image/png;base64,${base64}`,
      prompt: imagePrompt,
    };

    // Generate variants for different sizes and platforms
    const variants = [];

    // Add desktop ad variants
    campaign.hooks.forEach(hook => {
      // Facebook variants
      variants.push({
        platform: 'facebook',
        image: mainImage,
        size: { width: 1200, height: 628, label: "Facebook Feed" },
        headline: hook.text,
        description: `${businessIdea.valueProposition} - Perfect for ${targetAudience.name}`,
        callToAction: 'Learn More',
      });

      // Google variants
      variants.push({
        platform: 'google',
        image: mainImage,
        size: { width: 300, height: 250, label: "Medium Rectangle" },
        headline: hook.text.substring(0, 30) + (hook.text.length > 30 ? '...' : ''),
        description: businessIdea.valueProposition.substring(0, 90) + (businessIdea.valueProposition.length > 90 ? '...' : ''),
        callToAction: 'Learn More',
      });
    });

    // Add mobile ad variants
    campaign.hooks.forEach(hook => {
      variants.push({
        platform: 'facebook',
        image: mainImage,
        size: { width: 320, height: 100, label: "Mobile Banner" },
        headline: hook.text.substring(0, 25) + (hook.text.length > 25 ? '...' : ''),
        description: businessIdea.valueProposition.substring(0, 70) + (businessIdea.valueProposition.length > 70 ? '...' : ''),
        callToAction: 'Learn More',
        isMobile: true,
      });
    });

    return { variants };
  } catch (error) {
    console.error('Error in complete ad generation:', error);
    throw error;
  }
}