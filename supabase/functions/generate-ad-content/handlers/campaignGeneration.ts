export async function handleCampaignGeneration(businessIdea: any, targetAudience: any, audienceAnalysis: any, openAIApiKey: string) {
  const prompt = `Create a marketing campaign for the following business and audience:

  Business:
  Description: ${businessIdea.description}
  Value Proposition: ${businessIdea.valueProposition}

  Target Audience:
  ${JSON.stringify(targetAudience, null, 2)}

  Audience Analysis:
  ${JSON.stringify(audienceAnalysis, null, 2)}

  Create a complete marketing campaign with:
  1. 10 Marketing angles with associated hooks
  2. 3 Ad copies (different versions: story-based, short impact, AIDA framework)
  3. 3 Headlines (6 words max)

  Each marketing angle should be a brief, clear sentence explaining the approach.
  Each hook should be short, concise, and impactful, directly addressing the target audience.
  Ad copies should be general about the product benefits and work with any hook.
  Headlines should be 6 words maximum, highlighting solutions/benefits.

  Return ONLY a valid JSON object with these fields:
  {
    "angles": [
      {
        "description": "string (marketing angle description)",
        "hook": "string (associated hook)"
      }
    ],
    "adCopies": [
      {
        "type": "string (story|short|aida)",
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
      model: 'gpt-4o',
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