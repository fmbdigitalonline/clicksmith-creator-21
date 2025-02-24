
interface DeepEekParams {
  businessIdea: any;
  targetAudience: any;
  apiKey: string;
  version?: number;
}

export async function deepeek({ businessIdea, targetAudience, apiKey, version = 1 }: DeepEekParams) {
  console.log('Calling Deepeek with version:', version);
  
  try {
    const response = await fetch('https://api.deepeek.com/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: JSON.stringify({
          task: "Generate landing page content",
          version: version,
          businessIdea: businessIdea,
          targetAudience: targetAudience,
          requirements: {
            sections: [
              "hero",
              "features",
              "benefits",
              "testimonials",
              "pricing",
              "cta"
            ],
            tone: "professional and engaging",
            style: "modern and clean"
          }
        }),
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`DeepEek API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('DeepEek response:', data);

    // Add generation metadata
    return {
      ...data,
      generatedAt: new Date().toISOString(),
      version,
    };
  } catch (error) {
    console.error('DeepEek API error:', error);
    throw error;
  }
}
