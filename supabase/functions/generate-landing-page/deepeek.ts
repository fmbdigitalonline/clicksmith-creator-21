
interface ContentGenerationParams {
  businessIdea: {
    description: string;
    valueProposition: string;
  };
  targetAudience: {
    name: string;
    description: string;
    painPoints: string[];
    coreMessage: string;
    marketingAngle: string;
  };
  iterationNumber?: number;
}

const generateLandingPageContent = async (businessIdea: ContentGenerationParams['businessIdea'], targetAudience: ContentGenerationParams['targetAudience']) => {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OpenAI API key not found");

  console.log('Preparing landing page content generation...');

  const prompt = `Generate landing page content for a business with the following details:

Business Idea: ${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}
Target Audience: ${targetAudience.description}
Core Message: ${targetAudience.coreMessage}
Pain Points: ${targetAudience.painPoints.join(", ")}
Marketing Angle: ${targetAudience.marketingAngle}

Create compelling content for a landing page that includes:
1. A hero section with a headline, description, and call-to-action
2. Key features (3-4 items)
3. Benefits (3-4 items)
4. Customer testimonials (2-3)
5. FAQ items (3-4 questions and answers)
6. A final call-to-action section

Make the content compelling and persuasive. Focus on addressing the pain points and using the specified marketing angle.`;

  try {
    console.log('Making request to OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert copywriter specializing in landing page content that converts. Generate content in JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content generated");
    }

    console.log('Content generated successfully');
    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};

// Export the functionality as an object named 'deepeek'
export const deepeek = {
  generateLandingPageContent
};
