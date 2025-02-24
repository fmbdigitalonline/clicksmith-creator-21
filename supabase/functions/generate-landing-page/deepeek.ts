
interface DeepEekParams {
  businessIdea: any;
  targetAudience: any;
  apiKey: string;
  version?: number;
}

export async function deepeek({ businessIdea, targetAudience, apiKey, version = 1 }: DeepEekParams) {
  console.log('Calling Deepeek with version:', version);
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: `You are an expert landing page content generator. Generate unique and compelling content based on the business idea and target audience. Version: ${version}`
          },
          {
            role: 'user',
            content: JSON.stringify({
              task: "Generate landing page content",
              businessIdea,
              targetAudience,
              requirements: "Create unique and varied content each time"
            })
          }
        ],
        temperature: 0.8, // Increased temperature for more variation
        frequency_penalty: 1.0, // Added frequency penalty
        presence_penalty: 1.0, // Added presence penalty
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Deepeek response:', data);

    try {
      // Parse the response content as JSON if it's a string
      const contentString = data.choices[0].message.content;
      const parsedContent = typeof contentString === 'string' ? JSON.parse(contentString) : contentString;

      // Add generation metadata
      return {
        ...parsedContent,
        generatedAt: new Date().toISOString(),
        version,
      };
    } catch (parseError) {
      console.error('Error parsing API response:', parseError);
      throw new Error('Failed to parse generated content');
    }
  } catch (error) {
    console.error('Deepeek API error:', error);
    throw error;
  }
}
