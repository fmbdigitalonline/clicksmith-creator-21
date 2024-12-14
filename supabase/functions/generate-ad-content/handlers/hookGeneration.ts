export async function handleHookGeneration(businessIdea: any, targetAudience: any, openAIApiKey: string) {
  const prompt = `Generate compelling marketing angles and hooks for this business and target audience:

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

Create exactly 10 different marketing angles and hooks, each specifically addressing one of the deep pain points identified in the audience analysis. For each:
1. Marketing Angle: Write a clear, actionable marketing strategy that explains HOW we will position the product (e.g. "Position the product as a time-saving solution for busy professionals")
2. Hook: Write the actual ad copy that implements this angle (should be attention-grabbing and emotionally resonant)

Return ONLY a JSON array with exactly 10 items in this format:
[
  {
    "text": "The actual hook text that will be shown in the ad",
    "description": "The marketing angle/strategy explanation"
  }
]`;

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
            content: 'You are an expert marketing strategist that creates compelling marketing angles and hooks that convert. You write in a persuasive, emotional, and benefit-focused style. Return ONLY raw JSON arrays without any markdown formatting.'
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