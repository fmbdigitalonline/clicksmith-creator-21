import { corsHeaders } from "../_shared/cors.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.20.1/mod.ts";

const openAI = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const generateWithDeepseek = async (prompt: string) => {
  const chatCompletion = await openAI.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "deepseek-chat",
  });
  return chatCompletion.choices[0].message.content;
};

const generateBasicContent = (businessIdea: string, targetAudience: string) => {
  return {
    hero: {
      title: "Welcome",
      description: `Your landing page content is being generated for the business idea: ${businessIdea} and target audience: ${targetAudience}.`,
      ctaText: "Get Started",
    },
    value_proposition: {
      title: "Our Value Proposition",
      items: [
        "Compelling Feature 1",
        "Unique Benefit 1",
        "Advantageous Aspect 1",
      ],
    },
    features: {
      title: "Features",
      items: [
        "Feature 1",
        "Feature 2",
        "Feature 3",
      ],
    },
    proof: {
      title: "What Our Customers Say",
      testimonials: [
        {
          name: "John Doe",
          role: "Satisfied Customer",
          content: "This product/service exceeded my expectations!",
        },
      ],
    },
    pricing: {
      title: "Pricing Plans",
      plans: [
        {
          name: "Basic",
          price: "Free",
          features: ["Feature 1", "Feature 2"],
        },
      ],
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        {
          question: "How does this work?",
          answer: "It works magically!",
        },
      ],
    },
    finalCta: {
      title: "Ready to Get Started?",
      description: "Join us today and experience the difference.",
      ctaText: "Get Started Now",
    },
    footer: {
      links: {
        company: ["About", "Contact", "Careers"],
        resources: ["Help Center", "Terms", "Privacy"],
      },
    },
  };
};

const generateIterativeContent = async (
  projectId: string,
  businessIdea: string,
  targetAudience: string,
  currentContent?: any,
  isRefinement = false
) => {
  try {
    console.log("Attempting to generate content with Deepseek...");
    const prompt = `
      Create landing page content for this business idea.
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
    const body = await req.json();
    console.log("Received request body:", body);

    const { projectId, businessIdea, targetAudience, currentContent, isRefinement } = body;

    // Validate required fields
    const missingFields = [];
    if (!projectId) missingFields.push('projectId');
    if (!businessIdea) missingFields.push('businessIdea');
    if (!targetAudience) missingFields.push('targetAudience');

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    console.log("Generating content with parameters:", {
      projectId,
      businessIdea,
      targetAudience,
      isRefinement: !!isRefinement
    });

    const content = await generateIterativeContent(
      projectId,
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
        error: error.message,
        details: error.stack
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
