export async function handleAudienceAnalysis(businessIdea: any, targetAudience: any, openAIApiKey: string) {
  console.log('Starting audience analysis...');
  console.log('Business idea:', businessIdea);
  console.log('Target audience:', targetAudience);

  const prompt = `Analyze the following target audience for a business:
  Business Description: ${businessIdea.description}
  Value Proposition: ${businessIdea.valueProposition}
  
  Target Audience:
  Name: ${targetAudience.name}
  Description: ${targetAudience.description}
  Demographics: ${targetAudience.demographics}
  Pain Points: ${targetAudience.painPoints.join(', ')}
  ICP: ${targetAudience.icp}
  Core Message: ${targetAudience.coreMessage}
  
  Return a JSON object with these exact fields (no markdown formatting):
  {
    "expandedDefinition": "string describing potential group struggling with a problem",
    "marketDesire": "string describing deep market desire",
    "awarenessLevel": "string describing familiarity with problem/solution",
    "sophisticationLevel": "string describing familiarity with competing solutions",
    "deepPainPoints": ["3 main problems as array of strings"],
    "potentialObjections": ["3 main objections as array of strings"]
  }`;

  try {
    console.log('Sending request to OpenAI...');
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
            content: 'You are an expert market researcher. Always respond with raw JSON only, no markdown.'
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

    // Remove any potential markdown formatting
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    console.log('Cleaned content:', cleanContent);

    const analysis = JSON.parse(cleanContent);
    console.log('Parsed analysis:', analysis);

    // Validate the required fields
    const requiredFields = [
      'expandedDefinition',
      'marketDesire',
      'awarenessLevel',
      'sophisticationLevel',
      'deepPainPoints',
      'potentialObjections'
    ];

    for (const field of requiredFields) {
      if (!analysis[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(analysis.deepPainPoints) || !Array.isArray(analysis.potentialObjections)) {
      throw new Error('Pain points and objections must be arrays');
    }

    return { analysis };
  } catch (error) {
    console.error('Error in handleAudienceAnalysis:', error);
    throw error;
  }
}