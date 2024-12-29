export async function generateCampaign(businessIdea: any, targetAudience: any, audienceAnalysis: any, openAIApiKey: string) {
  const prompt = `Create a marketing campaign for this business and target audience:

Business:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify(targetAudience, null, 2)}

Audience Analysis:
${JSON.stringify(audienceAnalysis, null, 2)}

Create a complete marketing campaign with:
1. 3 Ad copies (different versions)
2. 3 Headlines (6 words max)

Ad Copy Guidelines:
- Create 3 different versions:
  1. "Younder story": Longer, storytelling-based
  2. "Short impact": One impactful sentence
  3. "AIDA version": Middle-length with bullet points
- Should be general about product benefits
- Must attract attention in first sentence
- Each version should be different

Headline Guidelines:
- Maximum 6 words
- Straight to the point
- Highlight solution, product, or feature
- Based on market awareness/sophistication

Return ONLY a valid JSON object with these fields:
{
  "adCopies": [
    {
      "type": "story|short|aida",
      "content": "string"
    }
  ],
  "headlines": ["string", "string", "string"]
}`;

  try {
    console.log('Sending request to OpenAI...');
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
            content: 'You are an expert marketing copywriter. Always respond with raw JSON only, no markdown.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    console.log('Raw OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    const content = data.choices[0].message.content;
    console.log('Content before parsing:', content);

    const campaign = JSON.parse(content);
    console.log('Parsed campaign:', campaign);

    return { campaign };
  } catch (error) {
    console.error('Error in generateCampaign:', error);
    throw error;
  }
}