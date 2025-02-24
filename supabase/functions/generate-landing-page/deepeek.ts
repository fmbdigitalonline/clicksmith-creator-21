
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1";

interface ContentGenerationParams {
  businessIdea: {
    description: string;
    valueProposition: string;
  };
  targetAudience: {
    icp: string;
    name: string;
    painPoints: string[];
    coreMessage: string;
    description: string;
    positioning: string;
    demographics: string;
    marketingAngle: string;
    marketingChannels: string[];
    messagingApproach: string;
  };
  iterationNumber?: number;
}

const generateLandingPageContent = async (businessIdea: any, targetAudience: any) => {
  const configuration = new Configuration({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
  });
  const openai = new OpenAIApi(configuration);

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
    const completion = await openai.createChatCompletion({
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
    });

    const response = completion.data.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No content generated");
    }

    return JSON.parse(response);
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};

// Export the functionality as an object named 'deepeek'
export const deepeek = {
  generateLandingPageContent
};
