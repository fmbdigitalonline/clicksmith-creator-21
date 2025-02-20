
import { corsHeaders } from "../_shared/cors.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.20.1/mod.ts";

const generateWithDeepseek = async (prompt: string) => {
  const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY");
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.deepseek.com',
  });

  const system_prompt = `
    You are a landing page content generator. Generate content in JSON format following this structure:
    {
      "hero": {
        "title": "string",
        "description": "string",
        "ctaText": "string"
      },
      "features": [
        {
          "title": "string",
          "description": "string"
        }
      ],
      "benefits": [
        {
          "title": "string",
          "description": "string"
        }
      ],
      "testimonials": [
        {
          "quote": "string",
          "author": "string",
          "title": "string"
        }
      ],
      "pricing": {
        "plans": [
          {
            "name": "string",
            "price": "string",
            "features": ["string"]
          }
        ]
      },
      "faq": {
        "items": [
          {
            "question": "string",
            "answer": "string"
          }
        ]
      }
    }
  `;

  try {
    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: system_prompt },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: 'json_object'
      },
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from Deepseek API");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error calling Deepseek API:", error);
    throw error;
  }
};

const generateBasicContent = (businessIdea: string, targetAudience: string) => {
  return {
    hero: {
      title: "Welcome to Our Platform",
      description: "We're here to help you succeed.",
      ctaText: "Get Started",
    },
    features: [
      {
        title: "Easy to Use",
        description: "Our platform is designed with simplicity in mind."
      },
      {
        title: "Powerful Features",
        description: "Everything you need to grow your business."
      }
    ],
    benefits: [
      {
        title: "Save Time",
        description: "Automate your workflows and focus on what matters."
      },
      {
        title: "Increase Revenue",
        description: "Optimize your operations for better results."
      }
    ],
    testimonials: [
      {
        quote: "This platform has transformed our business.",
        author: "John Doe",
        title: "CEO"
      }
    ],
    pricing: {
      plans: [
        {
          name: "Basic",
          price: "$9",
          features: ["Core Features", "Basic Support"]
        },
        {
          name: "Pro",
          price: "$29",
          features: ["All Features", "Priority Support"]
        }
      ]
    },
    faq: {
      items: [
        {
          question: "How does it work?",
          answer: "Our platform is designed to be intuitive and easy to use."
        },
        {
          question: "What support do you offer?",
          answer: "We offer comprehensive support to all our customers."
        }
      ]
    }
  };
};

const generateIterativeContent = async (
  projectId: string,
  businessName: string,
  businessIdea: string,
  targetAudience: string,
  currentContent?: any,
  isRefinement = false
) => {
  try {
    console.log("Attempting to generate content with Deepseek...");
    const prompt = `
      Create landing page content for a business named "${businessName}".
      Business idea: ${businessIdea}
      Target audience: ${targetAudience}
      ${isRefinement && currentContent ? `Current content to improve: ${JSON.stringify(currentContent)}` : ""}
      
      Please ensure the content is engaging, persuasive, and tailored to the target audience.
      Focus on the unique value proposition and benefits for the specified target audience.
    `;
    
    const content = await generateWithDeepseek(prompt);
    console.log("Successfully generated content with Deepseek");
    return content;
  } catch (error) {
    console.error("❌ Deepseek API error:", error);
    console.error("❌ Error in Deepseek generation, falling back to basic content:", error);
    return generateBasicContent(businessIdea, targetAudience);
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, businessName, businessIdea, targetAudience, currentContent, isRefinement } = await req.json();

    if (!projectId || !businessName || !businessIdea || !targetAudience) {
      throw new Error("Missing required fields");
    }

    const content = await generateIterativeContent(
      projectId,
      businessName,
      businessIdea,
      targetAudience,
      currentContent,
      isRefinement
    );

    const theme_settings = {
      heroLayout: "centered",
      featuresLayout: "grid",
      benefitsLayout: "grid",
      testimonialsLayout: "grid",
      pricingLayout: "grid",
    };

    return new Response(
      JSON.stringify({
        content,
        theme_settings,
        statistics: {
          metrics: [],
          data_points: []
        }
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
