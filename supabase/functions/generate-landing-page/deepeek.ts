
interface DeepEekParams {
  businessIdea: any;
  targetAudience: any;
  apiKey: string;
  version?: number;
}

export async function deepeek({ businessIdea, targetAudience, apiKey, version = 1 }: DeepEekParams) {
  console.log('Calling OpenAI with version:', version);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-2024-07-18",
        messages: [
          {
            role: "system",
            content: `You are an expert landing page content generator. Generate a unique and compelling landing page content based on the business idea and target audience information provided. Each generation should be unique and tailored to the specific needs. Version: ${version}`
          },
          {
            role: "user",
            content: JSON.stringify({
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
            })
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    try {
      // Parse the response content as JSON
      const contentString = data.choices[0].message.content;
      const parsedContent = JSON.parse(contentString);

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
    console.error('OpenAI API error:', error);
    throw error;
  }
}
