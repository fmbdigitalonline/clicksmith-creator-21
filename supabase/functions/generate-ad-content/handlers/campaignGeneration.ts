export async function handleCampaignGeneration(businessIdea: any, targetAudience: any, audienceAnalysis: any, openAIApiKey: string) {
  const prompt = `Create a marketing campaign for the following business and audience:

  Business:
  Description: ${businessIdea.description}
  Value Proposition: ${businessIdea.valueProposition}

  Target Audience:
  ${JSON.stringify(targetAudience, null, 2)}

  Audience Analysis:
  ${JSON.stringify(audienceAnalysis, null, 2)}

  Generate:
  1. 10 Marketing angles with associated hooks
  2. 3 Ad copies (different versions: story-based, short impact, AIDA framework)
  3. 3 Headlines (6 words max)

  Return ONLY a valid JSON object with these fields:
  {
    "angles": [
      {
        "description": "string (marketing angle description)",
        "hook": "string (associated hook)"
      }
    ],
    "adCopies": ["string", "string", "string"],
    "headlines": ["string", "string", "string"]
  }`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert marketing copywriter who creates compelling campaigns based on deep audience analysis.'
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

  const campaign = JSON.parse(data.choices[0].message.content.trim());
  return { campaign };
}