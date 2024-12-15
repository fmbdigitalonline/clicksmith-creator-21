export async function handleHookGeneration(businessIdea: any, targetAudience: any, openAIApiKey: string) {
  const prompt = `Create a marketing campaign for this business and target audience:

Business:
${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}

Target Audience:
Name: ${targetAudience.name}
Description: ${targetAudience.description}
Demographics: ${targetAudience.demographics}
Pain Points: ${targetAudience.painPoints.join(', ')}
Core Message: ${targetAudience.coreMessage}
Deep Pain Points: ${targetAudience.audienceAnalysis?.deepPainPoints?.join(', ') || 'Not available'}
Potential Objections: ${targetAudience.audienceAnalysis?.potentialObjections?.join(', ') || 'Not available'}

Think step by step:
1. Analyze the deep pain points and potential objections
2. Create different marketing angles to approach the target audience
3. Create hooks that match each marketing angle
4. Ensure hooks are short, concise, and impactful
5. Make it obvious the ad is for the target audience

Marketing Angle Definition:
- An approach to deliver messages about an offer to potential customers
- Should be a short, brief, and clear sentence explaining the angle
- All angles should be different from one another

Hook Guidelines:
- Address a specific marketing angle
- Very short, concise, and impactful
- Call out the target audience directly or through shared knowledge
- Can be questions, statements, or commands
- Can use humor or emotion when appropriate
- Must make the audience stop and read

Return ONLY a JSON array with exactly 10 items in this format:
[
  {
    "text": "The actual hook text that will be shown in the ad",
    "description": "The marketing angle explanation"
  }
]

Hook Examples:
"Hey, gym buffs! Crush your PRs with personalized hydration."
"Slip your way to a healthier you, effortlessly."
"Non-brain fog is real. Stay hydrated, stay on top of your game."
"Thirst is your trail buddy's worst enemy. Outsmart it with every adventure."`;

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
            content: 'You are an expert marketing strategist that creates compelling marketing angles and hooks based on deep audience analysis. Focus on creating angles that address specific pain points and hooks that make the target audience stop and read. Return ONLY raw JSON arrays without any markdown formatting.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    try {
      const content = data.choices[0].message.content.trim();
      console.log('Raw content:', content);
      
      const jsonContent = content.replace(/```json\n|\n```|```/g, '').trim();
      console.log('Cleaned content:', jsonContent);
      
      const hooks = JSON.parse(jsonContent);
      
      if (!Array.isArray(hooks) || hooks.length !== 10) {
        throw new Error('Response must be an array with exactly 10 items');
      }

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