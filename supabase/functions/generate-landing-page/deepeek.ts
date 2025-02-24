
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

Create a JSON object with the following structure, without any markdown formatting or code blocks:
{
  "hero": {
    "headline": "compelling headline",
    "description": "persuasive description",
    "cta": "call to action text"
  },
  "features": [
    {
      "title": "feature title",
      "description": "feature description"
    }
  ],
  "benefits": [
    {
      "title": "benefit title",
      "description": "benefit description"
    }
  ],
  "testimonials": [
    {
      "quote": "testimonial text",
      "author": "author name",
      "title": "author title"
    }
  ],
  "faq": [
    {
      "question": "question text",
      "answer": "answer text"
    }
  ],
  "finalCta": {
    "headline": "final call to action headline",
    "description": "final call to action description",
    "buttonText": "button text"
  }
}

Make the content compelling and persuasive. Focus on addressing the pain points and using the specified marketing angle. Return ONLY the JSON object, without any additional text, markdown formatting, or code blocks.`;

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
            content: "You are an expert copywriter specializing in landing page content that converts. You must return ONLY valid JSON without any markdown formatting or code blocks.",
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

    // Clean up the content string to remove any potential markdown or code block markers
    const cleanContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    console.log('Content generated successfully');
    try {
      return JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Error parsing JSON:', cleanContent);
      throw new Error('Failed to parse generated content as JSON');
    }
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};

// Export the functionality as an object named 'deepeek'
export const deepeek = {
  generateLandingPageContent
};
