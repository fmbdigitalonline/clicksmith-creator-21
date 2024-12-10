export async function handleAudienceGeneration(businessIdea: any, openAIApiKey: string) {
  const prompt = `Generate 3 distinct target audiences for the following business:
  Business Description: ${businessIdea.description}
  Value Proposition: ${businessIdea.valueProposition}

  For each audience, provide:
  1. Basic audience information
  2. Ideal Customer Profile (ICP)
  3. Core Message
  4. Positioning Strategy
  5. Marketing Angle
  6. Messaging Approach
  7. Core Marketing Channels

  Return ONLY a valid JSON array with exactly 3 audience objects, each containing these fields:
  - name (string): short, descriptive name
  - description (string): 2-3 sentences about the audience
  - painPoints (array of 3 strings): specific problems they face
  - demographics (string): age, income, location info
  - icp (string): detailed ideal customer profile
  - coreMessage (string): primary message that resonates with this audience
  - positioning (string): how the product should be positioned
  - marketingAngle (string): unique angle to approach this audience
  - messagingApproach (string): tone and style of communication
  - marketingChannels (array of strings): 2-3 most effective channels`;

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
          content: 'You are a JSON-focused market research analyst. Only return valid JSON arrays containing audience objects.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  const audiences = JSON.parse(data.choices[0].message.content.trim());
  return { audiences };
}