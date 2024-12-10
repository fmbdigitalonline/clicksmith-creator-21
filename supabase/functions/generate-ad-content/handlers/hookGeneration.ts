export async function handleHookGeneration(businessIdea: any, targetAudience: any, openAIApiKey: string) {
  const prompt = `Create 3 compelling Facebook ad hooks for the following business:
  Business Description: ${businessIdea.description}
  Value Proposition: ${businessIdea.valueProposition}
  
  Each hook should be:
  1. Attention-grabbing
  2. Emotionally resonant with the target audience
  3. Focused on benefits and solutions
  4. Under 100 characters
  5. Include a clear call to action
  
  Format each hook on a new line, numbered 1-3.`;

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
          content: 'You are an expert Facebook ad copywriter who creates compelling, conversion-focused ad hooks.'
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

  return { content: data.choices[0].message.content };
}