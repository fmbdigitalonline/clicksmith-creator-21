import { BusinessIdea, TargetAudience } from "../Types";

export const generateCampaign = async (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience
) => {
  try {
    const platforms = ['facebook', 'google', 'linkedin', 'tiktok'];
    const headlines = [
      "Validate Your Idea with Targeted Ads",
      "Target the Right Audience Effortlessly",
      "Save Time and Money on Marketing",
      "Find Your Ideal Customers Fast"
    ];

    const adCopies = [
      {
        type: 'story',
        content: `Have you ever felt lost trying to pinpoint your ideal customer? You're not alone. Many startup founders struggle with this crucial aspect, often spending countless hours and resources with little to show for it. Imagine a world where you could effortlessly identify your target audience and validate your business idea with precision. Our SaaS platform makes this possible, helping you create effective ads that resonate with your potential customers. No more guessing—just actionable insights that lead to success.`
      },
      {
        type: 'short',
        content: `Tired of wasting time and money on ads that don't work? Our platform helps you identify your ideal customers and creates ads that resonate. Start seeing results today!`
      },
      {
        type: 'aida',
        content: `Are you struggling to create ads that work? You're not alone. Many startup founders face this challenge. - Identify your target audience effortlessly. - Create ads for Facebook, Google, LinkedIn, and TikTok. - Validate your business idea before launch. With our SaaS platform, you'll save time and money while ensuring your marketing efforts are effective. Get started today and watch your startup thrive!`
      }
    ];

    // Generate variants for each platform
    const variants = platforms.flatMap(platform => {
      const sizes = getPlatformSizes(platform);
      return adCopies.map((copy, index) => ({
        platform,
        headline: headlines[index % headlines.length],
        description: copy.content,
        imageUrl: "https://replicate.delivery/czjl/7M1liDkrHOJoNBv7RCUFMzLQEjcag56mCjtmPIrdIvB9dVBF/tmpv0r6np7e.jpg",
        size: sizes[0] // Use first size as default
      }));
    });

    return {
      campaign: {
        headlines,
        adCopies,
        variants
      }
    };
  } catch (error) {
    console.error('Error generating campaign:', error);
    throw error;
  }
};

function getPlatformSizes(platform: string) {
  switch (platform) {
    case 'facebook':
      return [{
        width: 1200,
        height: 628,
        label: "Facebook Feed"
      }];
    case 'google':
      return [{
        width: 1200,
        height: 628,
        label: "Google Display"
      }];
    case 'linkedin':
      return [{
        width: 1200,
        height: 627,
        label: "LinkedIn Feed"
      }];
    case 'tiktok':
      return [{
        width: 1080,
        height: 1920,
        label: "TikTok Feed"
      }];
    default:
      return [{
        width: 1200,
        height: 628,
        label: "Standard Feed"
      }];
  }
}