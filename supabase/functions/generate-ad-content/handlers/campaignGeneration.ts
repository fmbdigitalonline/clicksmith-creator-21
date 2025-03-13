
import { BusinessIdea, TargetAudience } from "../types.ts";

// New function to generate compliance guidelines for ad copy
const getAdCopyComplianceGuidelines = (): string => {
  return `Ad Copy Compliance Guidelines:
- NO income or revenue claims (e.g., avoid "make $10,000 a month")
- NO false urgency phrases (e.g., avoid "limited time offer" or "act now")
- NO unrealistic promises about timeframes (e.g., avoid "quick results" or "overnight success")
- NO exaggerated claims about effectiveness (e.g., avoid "revolutionary" or "groundbreaking")
- NO testimonial-style language without proper context
- Use educational and informative language rather than promotional
- Focus on features and factual benefits without overpromising outcomes
- Be specific and factual rather than vague and sensational
- Avoid excessive use of capital letters, exclamation points, or sensational punctuation
- Eliminate language that could appear as clickbait or misleading`;
};

// Function to get platform-specific guidelines
const getPlatformCopyGuidelines = (platform: string): string => {
  const guidelines = {
    facebook: `Facebook Ad Guidelines:
- Avoid using "you" or "your" when referring to personal attributes
- Avoid before/after scenarios or implications
- Keep tone educational and focus on the solution, not the problem
- No health claims or references to personal attributes/conditions
- Avoid language that could be seen as discriminatory`,
    
    google: `Google Ad Guidelines:
- Keep ad copy under character limits (90 characters for headlines, 90 for descriptions)
- Use proper grammar and avoid unusual capitalization
- Make all claims verifiable and specific
- Avoid generic superlatives like "best" or "top-rated" without evidence
- Use clear calls to action that describe what users will find`,
    
    linkedin: `LinkedIn Guidelines:
- Use professional language appropriate for business audience
- Focus on professional development, not personal transformation
- Emphasize educational content and industry insights
- Use data and research-backed statements when possible
- Avoid overly casual or promotional tone`,
    
    tiktok: `TikTok Guidelines:
- Use authentic, conversational language
- Avoid direct calls to engage that break the fourth wall
- Keep language trendy but avoid clickbait-style hooks
- Focus on community and shared experiences
- Maintain a positive, non-controversial tone`
  };
  
  return guidelines[platform] || guidelines.facebook;
};

export async function generateCampaign(businessIdea: any, targetAudience: any, platform: string = 'facebook') {
  const prompt = `Create a marketing campaign for this business and target audience:

Business:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify(targetAudience, null, 2)}

${getAdCopyComplianceGuidelines()}

${getPlatformCopyGuidelines(platform)}

Create a complete marketing campaign with 6 unique ad versions, each with their own copy and headline but maintaining consistent messaging:

Ad Copy Guidelines:
- Create 6 distinctly different versions while maintaining the core message:
  1. "Educational format": Focus on explaining solutions and educating the audience
  2. "Value proposition": Highlight specific features and benefits without making promises
  3. "Problem-Solution": Describe a common challenge and your factual solution
  4. "Industry insights": Share relevant information and expertise in the field
  5. "Features-focused": Emphasize key features and specific functionality
  6. "Community format": Focus on community and shared experiences
- Each version should feel unique while targeting the same audience
- Must grab attention in first sentence while remaining factual
- Never use specific names or income claims
- Address the reader professionally with appropriate language for the platform
- Use the audience pain points from the analysis, but focus on education and solutions
- Highlight the product's features and specific benefits
- Keep similar length but vary structure and approach

Headline Guidelines:
- Create 6 unique headlines (one for each ad version)
- Maximum 6 words each, focus on clarity over cleverness
- Each should highlight a different feature or angle
- Focus on value and solutions, not transformational promises
- Make them specific, factual, and relevant to the target audience
- Avoid clickbait language or excessive punctuation

Return ONLY a valid JSON object with these fields:
{
  "adCopies": [
    {
      "type": "educational|value-proposition|problem-solution|industry-insights|features|community",
      "content": "string"
    }
  ],
  "headlines": ["string", "string", "string", "string", "string", "string"]
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
            content: 'You are an expert marketing copywriter specializing in creating compliant, educational ad content that follows platform guidelines. Create distinctly different versions that educate and inform the audience while avoiding exaggerated claims, unrealistic promises, or overly promotional language. All content must be platform-compliant and focus on factual information.'
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

    // Clean the content string to ensure it's valid JSON
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const campaign = JSON.parse(cleanContent);
    
    // Validate the campaign object structure
    if (!campaign.adCopies || !Array.isArray(campaign.adCopies) || !campaign.headlines || !Array.isArray(campaign.headlines)) {
      throw new Error('Invalid campaign structure');
    }

    console.log('Parsed campaign:', campaign);
    return { campaign };
  } catch (error) {
    console.error('Error in generateCampaign:', error);
    throw error;
  }
}
