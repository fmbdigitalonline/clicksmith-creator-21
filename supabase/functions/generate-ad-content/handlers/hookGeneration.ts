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
1. Summarize the conversation for yourself
2. Use the results from the audience analysis deep pain points and potential objections
3. Think of 10 different marketing angles to approach the target audience
4. Think of 10 different Hooks to use in ads for each marketing angle
5. Think of 3 different ad copies
6. Think of 3 different headlines
7. Generate your answer

Marketing angle Definition:
A marketing angle is an approach taken to deliver your messages about an offer to your potential customers.
Just write a short brief and clear sentence to explain the angle.
All angles should be different from one another.

Hooks Guidelines:
- Every hook should address a specific marketing angle
- Very short, concise and impactful
- Call out the target audience either obviously or through shared knowledge
- Goal is to make the audience stop and read
- Can be questions, statements, or commands
- Can use humor or emotion when appropriate
- Must make it obvious the ad is for them

Ad Copy Guidelines:
Create 3 different versions:
1. "Younder story": Longer, storytelling-based
2. "Short impact": One impactful sentence
3. "AIDA version": Middle-length with bullet points

Headline Guidelines:
- Maximum 6 words
- Straight to the point
- Highlight solution, product, or feature
- Based on market awareness/sophistication

Return ONLY a valid JSON array with exactly 10 items in this format:
[
  {
    "text": "The actual hook text that will be shown in the ad",
    "description": "The marketing angle explanation"
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