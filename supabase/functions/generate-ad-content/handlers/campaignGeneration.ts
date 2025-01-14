import { BusinessIdea, TargetAudience } from "../types.ts";

export async function generateCampaign(businessIdea: any, targetAudience: any, platform: string = 'facebook') {
  const prompt = `Create a marketing campaign for this business and target audience specifically for ${platform}:

Business:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify(targetAudience, null, 2)}

Create a complete marketing campaign with:
1. 3 Ad copies (different versions)
2. 3 Headlines (6 words max)

Platform-specific guidelines for ${platform}:
${getPlatformGuidelines(platform)}

Ad Copy Guidelines:
- Create different versions optimized for ${platform}:
  1. "Longer story": Longer, storytelling-based use pain point one from audience analysis
  2. "personal emotional story": personal emotional story use pain point two from audience analysis
  3. "AIDA version": Middle-length with bullet points use pain point three from audience analysis
- Should address audience analysis painpoints
- Must attract attention in first sentence
- Each version should be different
- Never use names and always talk directly to the reader, use words like you
- Follow ${platform}'s best practices and tone

Headline Guidelines:
- Maximum 6 words
- Straight to the point
- Highlight the result/benefit/goal
- Based on market awareness/sophistication
- Optimized for ${platform}'s format

Return ONLY a valid JSON object with these fields:
{
  "adCopies": [
    {
      "type": "story|short|aida",
      "content": "string"
    }
  ],
  "headlines": ["string", "string", "string"]
}`;

  try {
    console.log('Generating campaign for platform:', platform);
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
            content: `You are an expert ${platform} marketing copywriter. Always respond with raw JSON only, no markdown.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
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

    // Add platform to the response
    return { 
      campaign: {
        ...campaign,
        platform
      }
    };
  } catch (error) {
    console.error('Error in generateCampaign:', error);
    throw error;
  }
}

function getPlatformGuidelines(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'facebook':
      return `
- Focus on emotional connection and storytelling
- Keep copy concise but engaging
- Include clear call-to-action
- Optimize for mobile viewing
- Consider both feed and stories placement`;
    
    case 'google':
      return `
- Focus on keywords and search intent
- Keep headlines clear and benefit-driven
- Include specific call-to-action
- Maintain professional tone
- Optimize for different display network placements`;
    
    case 'linkedin':
      return `
- Use professional, business-focused language
- Focus on B2B benefits and value propositions
- Include industry-specific terminology
- Maintain formal tone
- Target professional pain points`;
    
    case 'tiktok':
      return `
- Use casual, trendy language
- Keep copy short and punchy
- Focus on entertainment value
- Include trending phrases/terms
- Optimize for vertical video format`;
    
    default:
      return `
- Focus on clear value proposition
- Keep messaging consistent
- Include clear call-to-action
- Optimize for platform-specific format`;
  }
}