import { BusinessIdea, TargetAudience } from "../types.ts";

export async function generateCampaign(businessIdea: any, targetAudience: any, language: string = 'en') {
  let systemPrompt = 'You are an expert marketing copywriter specializing in creating diverse but cohesive ad campaigns. Create distinctly different versions while maintaining the core message and brand voice.';
  
  // Add language instructions to system prompt
  if (language !== 'en') {
    systemPrompt += ` Respond in ${language} language only. All text must be in ${language}, not in English.`;
  }

  const prompt = `Create a marketing campaign for this business and target audience:

Business:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify(targetAudience, null, 2)}

Create a complete marketing campaign with 6 unique ad versions, each with their own copy and headline but maintaining consistent messaging:

Ad Copy Guidelines:
- Create 6 distinctly different versions while maintaining the core message:
  1. "Story version": Longer, narrative-focused using pain point one
  2. "Emotional appeal": Personal, emotionally resonant using pain point two
  3. "AIDA format": Attention, Interest, Desire, Action structure using pain point three
  4. "Problem-Solution": Highlight a specific problem and your solution
  5. "Benefits-focused": Emphasize key benefits and results
  6. "Social proof angle": Imply or reference customer success
- Each version should feel unique while targeting the same audience
- Must grab attention in first sentence
- Never use specific names
- Always address the reader directly using "you" and "your"
- Use the audience pain points from the analysis
- Highlight the product's benefits and positive experiences
- Keep similar length but vary structure and approach

Headline Guidelines:
- Create 6 unique headlines (one for each ad version)
- Maximum 6 words each
- Each should highlight a different benefit or angle
- Focus on results and transformation
- Based on market awareness level
- Keep the core value proposition consistent

Return ONLY a valid JSON object with these fields:
{
  "adCopies": [
    {
      "type": "story|emotional|aida|problem-solution|benefits|social-proof",
      "content": "string"
    }
  ],
  "headlines": ["string", "string", "string", "string", "string", "string"]
}

${language !== 'en' ? `IMPORTANT: All text in the returned JSON must be in ${language} language only, not in English.` : ''}`;

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
            content: systemPrompt
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

    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const campaign = JSON.parse(cleanContent);
    
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
