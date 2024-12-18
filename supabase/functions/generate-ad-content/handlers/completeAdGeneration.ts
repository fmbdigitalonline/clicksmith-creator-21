import { BusinessIdea, TargetAudience, MarketingCampaign } from '../types.ts';

export async function handleCompleteAdGeneration(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign: MarketingCampaign,
  openAIApiKey: string
) {
  try {
    // Generate one main image that will be used across variants
    const imagePrompt = `Create a professional advertisement image for:
    ${businessIdea.description}
    Target audience: ${targetAudience.description}
    Style: Clean, professional, business-appropriate`;

    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    const imageData = await imageResponse.json();
    if (!imageData.data?.[0]?.url) {
      throw new Error('Failed to generate image');
    }

    const mainImage = {
      url: imageData.data[0].url,
      prompt: imagePrompt,
    };

    // Generate ad variants for both platforms
    const variants = [];

    // Facebook variants
    campaign.hooks.forEach(hook => {
      variants.push({
        platform: 'facebook',
        image: mainImage,
        headline: hook.text,
        description: `${businessIdea.valueProposition} - Perfect for ${targetAudience.name}`,
        callToAction: 'Learn More',
      });
    });

    // Google variants
    campaign.hooks.forEach(hook => {
      variants.push({
        platform: 'google',
        image: mainImage,
        headline: hook.text.substring(0, 30) + (hook.text.length > 30 ? '...' : ''),
        description: businessIdea.valueProposition.substring(0, 90) + (businessIdea.valueProposition.length > 90 ? '...' : ''),
        callToAction: 'Learn More',
      });
    });

    return { variants };
  } catch (error) {
    console.error('Error in complete ad generation:', error);
    throw error;
  }
}