import { BusinessIdea, TargetAudience } from "../types.ts";

export async function generateCampaign(businessIdea: any, targetAudience: any) {
  const prompt = `Create a marketing campaign for this business and target audience:

Business:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify(targetAudience, null, 2)}

Create a complete marketing campaign with:
1. 20 Ad copies (5 for each platform: Facebook, Google, LinkedIn, TikTok)
2. 5 Headlines (6 words max)

Ad Copy Guidelines for each platform:

Facebook:
- Casual, conversational tone
- Focus on engagement and social proof
- Include clear call-to-action
- Optimal length: 125-250 characters
- Must attract attention in first sentence

Google:
- Professional, direct tone
- Focus on benefits and features
- Include keywords naturally
- Optimal length: 90 characters for description
- Clear value proposition

LinkedIn:
- Professional, business-focused tone
- Highlight industry expertise
- Focus on B2B benefits
- Include professional call-to-action
- Optimal length: 150-200 characters

TikTok:
- Young, trendy, casual tone
- Short, punchy messages
- Use trending language
- Focus on entertainment value
- Optimal length: 100-150 characters

For each platform create these variations:
1. "Problem-Solution": Start with pain point, then present solution
2. "Benefit-Driven": Focus on key benefits and outcomes
3. "Social Proof": Imply credibility and results
4. "FOMO/Urgency": Create sense of urgency or exclusivity
5. "Direct Offer": Clear value proposition

Headline Guidelines:
- Maximum 6 words
- Straight to the point
- Highlight benefits or solve pain points
- Make it action-oriented
- Based on market awareness/sophistication

Return ONLY a valid JSON object with these fields:
{
  "adCopies": [
    {
      "type": "story|short|aida",
      "content": "string",
      "platform": "facebook|google|linkedin|tiktok",
      "headline": "string"
    }
  ],
  "headlines": ["string", "string", "string", "string", "string"]
}`;

  try {
    console.log('Sending request to OpenAI...');
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
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert marketing copywriter specializing in platform-specific ad copy. Create diverse, engaging ad variations that match each platform\'s style and requirements.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    console.log('Raw OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    const content = data.choices[0].message.content;
    console.log('Content before parsing:', content);

    const campaign = JSON.parse(content);
    console.log('Parsed campaign:', campaign);

    // Ensure we have enough variations for each platform
    const platforms = ['facebook', 'google', 'linkedin', 'tiktok'];
    const platformAds = {};
    
    // Initialize arrays for each platform
    platforms.forEach(platform => {
      platformAds[platform] = campaign.adCopies.filter((ad: any) => ad.platform === platform);
    });

    // Ensure minimum 5 ads per platform
    platforms.forEach(platform => {
      while (platformAds[platform].length < 5) {
        const sourceAd = platformAds[platform][Math.floor(Math.random() * platformAds[platform].length)] || campaign.adCopies[0];
        platformAds[platform].push({
          ...sourceAd,
          platform,
          headline: campaign.headlines[platformAds[platform].length % campaign.headlines.length]
        });
      }
    });

    // Combine all platform ads
    campaign.adCopies = Object.values(platformAds).flat();

    // Add platform-specific sizes
    campaign.adCopies = campaign.adCopies.map((ad: any) => ({
      ...ad,
      size: getPlatformAdSize(ad.platform)
    }));

    return { campaign };
  } catch (error) {
    console.error('Error in generateCampaign:', error);
    throw error;
  }
}

function getPlatformAdSize(platform: string) {
  switch (platform) {
    case 'facebook':
      return {
        width: 1200,
        height: 628,
        label: "Facebook Feed"
      };
    case 'google':
      return {
        width: 1200,
        height: 628,
        label: "Google Display"
      };
    case 'linkedin':
      return {
        width: 1200,
        height: 627,
        label: "LinkedIn Feed"
      };
    case 'tiktok':
      return {
        width: 1080,
        height: 1920,
        label: "TikTok Feed"
      };
    default:
      return {
        width: 1200,
        height: 628,
        label: "Standard Display"
      };
  }
}