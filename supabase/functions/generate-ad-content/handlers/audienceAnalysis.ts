export async function handleAudienceAnalysis(businessIdea: any, targetAudience: any, openAIApiKey: string) {
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
  
  Provide a deep analysis following this structure:
  
  1. Expanded Definition:
  (Define potential group of people struggling with a problem who want to achieve a goal)
  
  2. Market Analysis:
  - Market Desire (deep desire from Breakthrough Advertising, not obvious product benefits)
  - Awareness Level (familiarity with problem/solution/product + actionable advertising approach)
  - Sophistication Level (familiarity with competing solutions + complexity of needs)
  
  3. Deep Pain Points (3 main problems)
  
  4. Potential Objections (3 main objections to buying)
  
  Return ONLY a valid JSON object with these fields:
  {
    "expandedDefinition": "string",
    "marketDesire": "string",
    "awarenessLevel": "string",
    "sophisticationLevel": "string",
    "deepPainPoints": ["string", "string", "string"],
    "potentialObjections": ["string", "string", "string"]
  }`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert market researcher who provides deep audience analysis based on Eugene Schwartz\'s Breakthrough Advertising principles.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  const generatedContent = data.choices[0].message.content;
  const analysis = JSON.parse(generatedContent.trim());

  return { analysis };
}