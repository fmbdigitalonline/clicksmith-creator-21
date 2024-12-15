export async function handleHookGeneration(businessIdea: any, targetAudience: any, openAIApiKey: string) {
  const prompt = `Create strategic marketing angles and hooks for this business and target audience:

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

Create exactly 10 different marketing angles and hooks. Each marketing angle must be a specific strategic positioning approach, NOT a description of the hook or features.

Marketing Angle Examples:
❌ BAD: "Highlights the benefits of our software for restaurant owners"
✅ GOOD: "Position as the premium done-for-you solution for overwhelmed owners"

❌ BAD: "Shows how the product saves money and ensures compliance"
✅ GOOD: "Position as the all-in-one cost-reducer for budget-conscious owners"

❌ BAD: "Explains the time-saving features of our platform"
✅ GOOD: "Position as the 5-minute setup solution for time-strapped managers"

Each marketing angle MUST:
1. Start with an action verb (Position, Frame, Present, etc.)
2. Include a clear strategic direction (as the, like a, etc.)
3. Target a specific audience pain point
4. NOT describe the hook or features

The hook should be the actual ad copy that implements this strategic angle.

Return ONLY a JSON array with exactly 10 items in this format:
[
  {
    "text": "The actual hook text that will be shown in the ad",
    "description": "Position as the [strategic approach] for [specific audience segment]"
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
            content: 'You are an expert marketing strategist that creates strategic positioning angles. You focus on HOW to position the product, not what features to highlight. Every marketing angle must start with an action verb and include a strategic direction. Return ONLY raw JSON arrays without any markdown formatting.'
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
        
        // Validate marketing angle format
        if (!hook.description.toLowerCase().startsWith('position') && 
            !hook.description.toLowerCase().startsWith('frame') && 
            !hook.description.toLowerCase().startsWith('present')) {
          throw new Error(`Marketing angle at index ${index} must start with an action verb`);
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