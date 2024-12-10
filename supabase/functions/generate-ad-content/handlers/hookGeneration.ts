export async function handleHookGeneration(businessIdea: any, targetAudience: any, openAIApiKey: string) {
  const prompt = `Create compelling Facebook ad hooks based on this business and audience analysis:

Business:
Description: ${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}

Target Audience:
Name: ${targetAudience.name}
Description: ${targetAudience.description}
Demographics: ${targetAudience.demographics}
Pain Points: ${targetAudience.painPoints.join(', ')}
ICP: ${targetAudience.icp}
Core Message: ${targetAudience.coreMessage}

Create 10 different marketing angles with associated hooks:

Each marketing angle should be a brief, clear sentence explaining the approach.
Each hook should be short, concise, and impactful, directly addressing the target audience.

The hook should make the target audience stop and read the ad - it must be obvious it's for them!
Hooks can be questions, statements, or commands.
Include humor or emotion when appropriate.

Format each pair as:
Marketing Angle: [Brief explanation of the approach]
Hook: [Short, impactful hook that addresses the audience]

Return ONLY a valid JSON array with objects containing:
{
  "text": "The hook text",
  "description": "The marketing angle explanation"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert Facebook ad copywriter specializing in hooks that grab attention and speak directly to the target audience. Return only valid JSON arrays containing hook objects with text and description fields.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  if (data.error) {
    console.error('Error generating hooks:', data.error);
    throw new Error(data.error.message);
  }

  try {
    const content = data.choices[0].message.content;
    const hooks = JSON.parse(content);
    console.log('Generated hooks:', hooks);
    return { hooks };
  } catch (error) {
    console.error('Error parsing hooks:', error);
    throw new Error('Failed to parse hook data');
  }
}