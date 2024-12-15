export async function handleCampaignGeneration(businessIdea: any, targetAudience: any, audienceAnalysis: any, openAIApiKey: string) {
  const prompt = `Create a marketing campaign for this business and target audience:

Business:
Description: ${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}

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
          content: 'You are an expert marketing copywriter who creates compelling campaigns based on deep audience analysis. Focus on clear, impactful messaging that resonates with the target audience.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  try {
    const campaign = JSON.parse(data.choices[0].message.content.trim());
    return { campaign };
  } catch (error) {
    console.error('Error parsing campaign:', error);
    throw new Error('Failed to parse campaign data');
  }
}