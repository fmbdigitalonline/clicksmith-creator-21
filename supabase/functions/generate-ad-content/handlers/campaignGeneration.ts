
import { BusinessIdea, TargetAudience } from "../types.ts";

export async function generateCampaign(businessIdea: any, targetAudience: any) {
  const prompt = `Create a marketing campaign for this business and target audience:

Business:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify(targetAudience, null, 2)}

Create a complete marketing campaign with 6 unique ad versions, each with their own copy and headline but maintaining consistent messaging:

Ad Copy Guidelines:
Create 6 distinctly different versions while maintaining the core message. Each version must have its own matching headline that reflects its specific approach:

1. "Story version":
   - Ad Copy: Longer, narrative-focused using pain point one
   - Headline: Focus on the transformation or journey (max 6 words)

2. "Emotional appeal":
   - Ad Copy: Personal, emotionally resonant using pain point two
   - Headline: Emphasize emotional benefit or relief (max 6 words)

3. "AIDA format":
   - Ad Copy: Attention, Interest, Desire, Action structure using pain point three
   - Headline: Focus on immediate value or urgency (max 6 words)

4. "Problem-Solution":
   - Ad Copy: Highlight a specific problem and your solution
   - Headline: Present the solution benefit (max 6 words)

5. "Benefits-focused":
   - Ad Copy: Emphasize key benefits and results
   - Headline: Highlight primary tangible benefit (max 6 words)

6. "Social proof angle":
   - Ad Copy: Imply or reference customer success
   - Headline: Focus on proven results/outcomes (max 6 words)

General Guidelines for All Versions:
- Each version must feel distinctly unique
- Must grab attention in first sentence
- Never use specific names
- Always address the reader directly using "you" and "your"
- Use the audience pain points from the analysis
- Highlight the product's benefits and positive experiences
- Keep similar length but vary structure and approach

Return ONLY a valid JSON object with these exact fields and nothing else (no markdown, no backticks):
{
  "adCopies": [
    {
      "type": "story|emotional|aida|problem-solution|benefits|social-proof",
      "content": "string",
      "headline": "string"
    }
  ]
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
            content: 'You are an expert marketing copywriter. You must return ONLY valid JSON with no markdown formatting or backticks.'
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

    const content = data.choices[0].message.content.trim();
    console.log('Content before parsing:', content);

    // Clean the content string to ensure it's valid JSON
    const cleanContent = content
      .replace(/```json\s*/g, '')  // Remove ```json
      .replace(/```\s*$/g, '')     // Remove closing ```
      .trim();

    const rawCampaign = JSON.parse(cleanContent);
    
    // Transform the response to match the expected format
    const campaign = {
      adCopies: rawCampaign.adCopies,
      headlines: rawCampaign.adCopies.map((ad: any) => ad.headline)
    };
    
    console.log('Parsed campaign:', campaign);

    return { campaign };
  } catch (error) {
    console.error('Error in generateCampaign:', error);
    throw new Error(`Failed to generate campaign: ${error.message}`);
  }
}
