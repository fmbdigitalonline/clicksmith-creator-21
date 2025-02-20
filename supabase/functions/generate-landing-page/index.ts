
import { corsHeaders } from "../_shared/cors.ts";
import { generateContent } from "./deepeek.ts";

const generateWithDeepeek = async (prompt: string) => {
  const apiKey = Deno.env.get("DEEPEEK_API_KEY");
  if (!apiKey) {
    throw new Error("Missing DEEPEEK_API_KEY");
  }

  const response = await fetch("https://api.deepeek.com/v1/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Deepeek API returned ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].text;
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
    console.log("Attempting to generate content with Deepeek...");
    const content = await generateWithDeepeek(`
      Create landing page content for a business named "${businessName}".
      Business idea: ${businessIdea}
      Target audience: ${targetAudience}
      ${isRefinement && currentContent ? `Current content to improve: ${JSON.stringify(currentContent)}` : ""}
    `);

    console.log("Successfully generated content with Deepeek");
    return JSON.parse(content);
  } catch (error) {
    console.error("❌ Deepeek API error:", error);
    console.error("❌ Error in Deepeek generation, falling back to basic content:", error);
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
