export async function handleAudienceGeneration(businessIdea: any, openAIApiKey: string) {
  const prompt = `As a market research professional, analyze this business and provide 3 potential target audiences:
  Business Description: ${businessIdea.description}
  Value Proposition: ${businessIdea.valueProposition}

  For each audience, provide professional market research insights including:
  1. Audience name and description
  2. Demographic information
  3. Key pain points (3 specific challenges)
  4. Ideal Customer Profile (ICP)
  5. Core messaging strategy
  6. Market positioning
  7. Marketing approach
  8. Recommended channels

  Return a JSON array with 3 audience objects containing:
  - name (string): descriptive name
  - description (string): professional audience description
  - painPoints (array of 3 strings): key challenges
  - demographics (string): demographic information
  - icp (string): ideal customer profile
  - coreMessage (string): primary value proposition
  - positioning (string): market positioning
  - marketingAngle (string): strategic approach
  - messagingApproach (string): communication strategy
  - marketingChannels (array of strings): recommended channels

  Format: Return only a raw JSON array starting with [ and ending with ]. No markdown or formatting.`;

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
            content: 'You are a professional market research analyst providing structured business insights. Return only raw JSON data.'
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
      
      // Handle safety system rejection specifically
      if (errorData.includes('safety system')) {
        throw new Error('Content filtered by safety system. Please revise your business description to use more professional language.');
      }
      
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    const content = data.choices[0].message.content.trim();
    console.log('Raw content from OpenAI:', content);

    // Clean the JSON content
    const cleanContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^[\s\n]*\[/, '[')
      .replace(/\][\s\n]*$/, ']')
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