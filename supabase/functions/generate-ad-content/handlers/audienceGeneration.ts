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

  IMPORTANT: Return ONLY the raw JSON array. Do not include any markdown formatting, code blocks, or explanatory text.`;

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
            content: 'You are a market research analyst. You must return ONLY a raw JSON array. Do not include any markdown formatting, backticks, or code blocks. The response should start with [ and end with ].'
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

    // Ensure we're working with clean JSON
    const cleanContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^[\s\n]*\[/, '[')  // Clean start of array
      .replace(/\][\s\n]*$/, ']')  // Clean end of array
      .trim();

    console.log('Cleaned content:', cleanContent);

    try {
      const audiences = JSON.parse(cleanContent);
      console.log('Parsed audiences:', audiences);

      if (!Array.isArray(audiences)) {
        console.error('Not an array:', audiences);
        throw new Error('Response is not an array');
      }

      if (audiences.length !== 3) {
        console.error('Wrong number of audiences:', audiences.length);
        throw new Error('Expected exactly 3 audiences');
      }

      // Validate the structure of each audience object
      audiences.forEach((audience, index) => {
        const requiredFields = [
          'name', 'description', 'painPoints', 'demographics',
          'icp', 'coreMessage', 'positioning', 'marketingAngle',
          'messagingApproach', 'marketingChannels'
        ];

        requiredFields.forEach(field => {
          if (!audience[field]) {
            console.error(`Missing field "${field}" in audience ${index + 1}:`, audience);
            throw new Error(`Missing required field "${field}" in audience ${index + 1}`);
          }
        });

        if (!Array.isArray(audience.painPoints)) {
          console.error('Invalid painPoints:', audience.painPoints);
          throw new Error(`painPoints must be an array in audience ${index + 1}`);
        }

        if (!Array.isArray(audience.marketingChannels)) {
          console.error('Invalid marketingChannels:', audience.marketingChannels);
          throw new Error(`marketingChannels must be an array in audience ${index + 1}`);
        }
      });

      return { audiences };
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Content that failed to parse:', cleanContent);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in handleAudienceGeneration:', error);
    throw error;
  }
}