export async function handleHookGeneration(businessIdea: any, targetAudience: any, openAIApiKey: string) {
  const prompt = `Generate marketing angles and hooks for this business and target audience:

Business:
${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}

Target Audience:
Name: ${targetAudience.name}
Description: ${targetAudience.description}
Demographics: ${targetAudience.demographics}
Pain Points: ${targetAudience.painPoints.join(', ')}
Core Message: ${targetAudience.coreMessage}

Create exactly 10 different marketing angles with associated hooks. Each marketing angle should be a brief, clear sentence explaining the approach, and each hook should be short, concise, and impactful, directly addressing the target audience.

Format your response as a valid JSON array with exactly 10 objects, each containing:
{
  "text": "The hook text",
  "description": "The marketing angle explanation"
}

Example of ONE object (you should generate 10):
{
  "text": "Hey gym buffs! Crush your PRs with personalized hydration.",
  "description": "Appeal to fitness enthusiasts by focusing on performance enhancement"
}`;

  try {
    console.log('Sending prompt to OpenAI:', prompt);

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
            content: 'You are a marketing expert that generates hooks and marketing angles. Always return exactly 10 objects in a valid JSON array format.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const content = data.choices[0].message.content;
    console.log('Generated content:', content);

    try {
      const hooks = JSON.parse(content);
      
      if (!Array.isArray(hooks) || hooks.length !== 10) {
        throw new Error('Response must be an array with exactly 10 items');
      }

      // Validate each hook object has the required structure
      hooks.forEach((hook, index) => {
        if (!hook.text || !hook.description) {
          throw new Error(`Hook at index ${index} is missing required fields`);
        }
      });

      console.log('Successfully parsed hooks:', hooks);
      return { hooks };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse hook data: ' + parseError.message);
    }
  } catch (error) {
    console.error('Error in hook generation:', error);
    throw error;
  }
}