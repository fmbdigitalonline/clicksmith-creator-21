import { BusinessIdea, TargetAudience } from "../types.ts";

export async function generateCampaign(businessIdea: any, targetAudience: any) {
  const prompt = `Create a marketing campaign for this business and target audience:

Business:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify(targetAudience, null, 2)}

Create a complete marketing campaign with:
1. 10 Ad copies (different versions)
2. 5 Headlines (6 words max)

Ad Copy Guidelines:
- Create 10 different versions and rotate:
  1. "Problem-Solution": Start with a pain point, then present the solution
  2. "Benefit-Driven": Focus on key benefits and outcomes
  3. "Social Proof": Imply credibility and results
  4. "FOMO/Urgency": Create sense of urgency or exclusivity
  5. "Question-Based": Start with engaging question
  6. "How-To": Educational approach
  7. "Story-Based": Brief narrative format
  8. "Direct Offer": Clear value proposition
  9. "Emotional Appeal": Focus on feelings and desires
  10. "Feature Highlight": Spotlight key features
- Each version should be different and engaging
- Must attract attention in first sentence
- Never use names and always talk directly to the reader
- Include clear call-to-action
- Adapt tone based on platform (Facebook: casual, Google: professional)

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
      "platform": "facebook|google"
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
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert marketing copywriter specializing in platform-specific ad copy. Create diverse, engaging ad variations that match each platform\'s style.'
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
    const facebookAds = campaign.adCopies.filter((ad: any) => ad.platform === 'facebook');
    const googleAds = campaign.adCopies.filter((ad: any) => ad.platform === 'google');

    // If we don't have enough ads for each platform, duplicate some while varying the headlines
    while (facebookAds.length < 5) {
      const sourceAd = facebookAds[Math.floor(Math.random() * facebookAds.length)];
      facebookAds.push({
        ...sourceAd,
        headline: campaign.headlines[facebookAds.length % campaign.headlines.length]
      });
    }

    while (googleAds.length < 5) {
      const sourceAd = googleAds[Math.floor(Math.random() * googleAds.length)];
      googleAds.push({
        ...sourceAd,
        headline: campaign.headlines[googleAds.length % campaign.headlines.length]
      });
    }

    campaign.adCopies = [...facebookAds, ...googleAds];

    return { campaign };
  } catch (error) {
    console.error('Error in generateCampaign:', error);
    throw error;
  }
}