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

Create exactly 10 different marketing angles and hooks, each specifically addressing one of the deep pain points identified in the audience analysis. Each hook should:
1. Have a clear marketing angle that resonates with the target audience
2. Include a compelling hook that grabs attention
3. Connect emotionally with the audience's pain points
4. Include a clear call to action

Format your response as a valid JSON array with exactly 10 objects, each containing:
{
  "text": "The actual hook text that will be shown in the ad",
  "description": "A brief, compelling marketing angle that explains the emotional appeal"
}

Make sure each hook is written in a marketing voice, ready to be used in an ad, and focuses on benefits and solutions rather than explanations.`;

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
            content: 'You are an expert marketing copywriter that creates compelling hooks and marketing angles that convert. You write in a persuasive, emotional, and benefit-focused style.'
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

    const content = data.choices[0].message.content;
    console.log('Generated content:', content);

    try {
      let hooks;
      // Sometimes the API returns the JSON string with extra text before or after
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        hooks = JSON.parse(jsonMatch[0]);
      } else {
        hooks = JSON.parse(content);
      }
      
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