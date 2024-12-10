export async function handleHookGeneration(businessIdea: any, targetAudience: any, openAIApiKey: string) {
  const prompt = `Create 3 compelling Facebook ad hooks for the following business:
  Business Description: ${businessIdea.description}
  Value Proposition: ${businessIdea.valueProposition}
  Target Audience: ${targetAudience.name}
  Audience Demographics: ${targetAudience.demographics}
  
  For each hook, provide:
  1. A short, attention-grabbing headline (under 100 characters)
  2. A brief description explaining the hook's appeal
  
  Format the response as a JSON array with objects containing 'text' and 'description' fields.`;

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
          content: 'You are an expert Facebook ad copywriter. Return only valid JSON arrays containing hook objects with text and description fields.'
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

  try {
    const content = data.choices[0].message.content;
    const hooks = JSON.parse(content);
    return { hooks };
  } catch (error) {
    console.error('Error parsing hooks:', error);
    // Fallback to a simpler format if JSON parsing fails
    const text = data.choices[0].message.content;
    const defaultHooks = [
      {
        text: "Transform Your Business Today",
        description: "A compelling call to action for immediate transformation"
      }
    ];
    return { hooks: defaultHooks };
  }
}