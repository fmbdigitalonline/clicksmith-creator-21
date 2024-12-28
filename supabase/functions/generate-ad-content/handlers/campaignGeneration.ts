export async function handleCampaignGeneration(businessIdea: any, targetAudience: any, audienceAnalysis: any, openAIApiKey: string) {
  const prompt = `Create compelling ad copy variations for this business and target audience:

Business:
Description: ${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}

Target Audience:
${JSON.stringify(targetAudience, null, 2)}

Audience Analysis:
${JSON.stringify(audienceAnalysis, null, 2)}

Create a complete set of ad copies with:
1. 5 Long-form Ad Copies (minimum 200 characters each)
2. 3 Headlines (6 words max)

Ad Copy Guidelines:
- Create 5 different versions, each at least 200 characters long
- Each version should have a unique angle or approach:
  1. "Problem-Solution": Focus on the pain point and your solution
  2. "Benefits-First": Highlight the main benefits and outcomes
  3. "Social Proof": Write as if including testimonials or results
  4. "Emotional Appeal": Connect with the audience's desires and fears
  5. "Feature-Benefit": Connect product features to audience benefits
- Must attract attention in first sentence
- Include clear call-to-action
- Each version should be different in tone and approach

Headline Guidelines:
- Maximum 6 words
- Straight to the point
- Highlight solution, product, or feature
- Based on market awareness/sophistication

Return ONLY a valid JSON object with these fields:
{
  "adCopies": [
    {
      "type": "problem_solution|benefits|social_proof|emotional|feature",
      "content": "string (min 200 chars)"
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
          content: 'You are an expert marketing copywriter who creates compelling, long-form ad copies based on deep audience analysis. Focus on clear, impactful messaging that resonates with the target audience while maintaining minimum length requirements.'
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