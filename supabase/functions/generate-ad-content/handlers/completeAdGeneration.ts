export async function handleCompleteAdGeneration(businessIdea: any, targetAudience: any, campaign: any, openAIApiKey: string, regenerationCount: number = 0) {
  console.log(`Starting complete ad generation... (regeneration #${regenerationCount})`);
  
  // Add regeneration-specific instructions to the prompt
  const basePrompt = `Generate unique and creative ad variants for this business 
  (consider this is regeneration attempt #${regenerationCount}, so provide completely fresh and innovative approaches):
  
  Business: ${JSON.stringify(businessIdea)}
  Audience: ${JSON.stringify(targetAudience)}
  Campaign: ${JSON.stringify(campaign)}
  
  Important: For each regeneration:
  - Explore different emotional triggers
  - Use varied creative approaches
  - Test alternative value propositions
  - Try unique messaging angles
  - Experiment with different visual concepts
  
  Requirements:
  - Each variant must be completely different from previous generations
  - Use fresh perspectives and innovative approaches
  - Maintain brand consistency while exploring creative boundaries`;

  try {
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
          { role: 'user', content: basePrompt }
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
  } catch (error) {
    console.error('Error in handleCompleteAdGeneration:', error);
    throw error;
  }
}
