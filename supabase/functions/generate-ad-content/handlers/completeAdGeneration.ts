import { BusinessIdea, TargetAudience, MarketingCampaign, AdSize } from '../types.ts';

const adSpecs = {
  commonSizes: [
    { width: 250, height: 250, label: "Square" },
    { width: 200, height: 200, label: "Small Square" },
    { width: 468, height: 60, label: "Banner" },
    { width: 728, height: 90, label: "Leaderboard" },
    { width: 300, height: 250, label: "Inline Rectangle" },
    { width: 336, height: 280, label: "Large Rectangle" },
    { width: 120, height: 600, label: "Skyscraper" },
    { width: 160, height: 600, label: "Wide Skyscraper" },
    { width: 300, height: 600, label: "Half-Page Ad" },
    { width: 970, height: 90, label: "Large Leaderboard" }
  ],
  mobileCommonSizes: [
    { width: 300, height: 50, label: "Mobile Banner" },
    { width: 320, height: 50, label: "Mobile Banner" },
    { width: 320, height: 100, label: "Large Mobile Banner" }
  ]
};

export async function handleCompleteAdGeneration(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign: MarketingCampaign,
  openAIApiKey: string
) {
  try {
    // Generate one main high-quality image
    const imagePrompt = `Create a professional advertisement image for:
    ${businessIdea.description}
    Target audience: ${targetAudience.description}
    Style: Clean, professional, business-appropriate
    Requirements: High resolution, vibrant colors, clear focal point
    Minimum width: 1500px for responsive scaling`;

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
        quality: "hd",
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

    // Generate variants for different sizes and platforms
    const variants = [];

    // Add desktop ad variants
    adSpecs.commonSizes.forEach(size => {
      // Facebook variants
      campaign.hooks.forEach(hook => {
        variants.push({
          platform: 'facebook',
          image: mainImage,
          size: size,
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
          size: size,
          headline: hook.text.substring(0, 30) + (hook.text.length > 30 ? '...' : ''),
          description: businessIdea.valueProposition.substring(0, 90) + (businessIdea.valueProposition.length > 90 ? '...' : ''),
          callToAction: 'Learn More',
        });
      });
    });

    // Add mobile ad variants
    adSpecs.mobileCommonSizes.forEach(size => {
      campaign.hooks.forEach(hook => {
        variants.push({
          platform: 'facebook',
          image: mainImage,
          size: size,
          headline: hook.text.substring(0, 25) + (hook.text.length > 25 ? '...' : ''),
          description: businessIdea.valueProposition.substring(0, 70) + (businessIdea.valueProposition.length > 70 ? '...' : ''),
          callToAction: 'Learn More',
          isMobile: true,
        });
      });
    });

    return { variants };
  } catch (error) {
    console.error('Error in complete ad generation:', error);
    throw error;
  }
}