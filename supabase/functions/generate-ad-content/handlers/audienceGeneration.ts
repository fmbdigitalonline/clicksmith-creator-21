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
  - marketingChannels (array of strings): 2-3 most effective channels

  Format the response as a valid JSON array without any markdown formatting or code blocks.`;

  try {
    console.log('Sending request to OpenAI with prompt:', prompt);
    
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
            content: 'You are a JSON-focused market research analyst. Return only valid JSON arrays containing audience objects, without any markdown formatting or code blocks.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    const content = data.choices[0].message.content.trim();
    console.log('Raw content from OpenAI:', content);

    try {
      const audiences = JSON.parse(content);
      console.log('Parsed audiences:', audiences);

      if (!Array.isArray(audiences) || audiences.length !== 3) {
        throw new Error('Invalid audience data format');
      }

      return { audiences };
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in handleAudienceGeneration:', error);
    throw error;
  }
}