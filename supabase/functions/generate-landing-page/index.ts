
import { corsHeaders } from "../_shared/cors.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.20.1/mod.ts";

const openAI = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const generateLandingPageContent = async (prompt: string) => {
  try {
    console.log("Generating content with GPT-4-mini...");
    const chatCompletion = await openAI.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a landing page content expert that creates engaging, conversion-focused content based on business ideas and target audiences."
        },
        { role: "user", content: prompt }
      ],
    });
    
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("❌ OpenAI API error:", error);
    throw error;
  }
};

const generateBasicContent = (businessIdea: any, targetAudience: any) => {
  return {
    hero: {
      title: "Welcome",
      description: `Transform your business with our innovative solution designed for ${targetAudience?.demographics || 'you'}.`,
      ctaText: "Get Started",
    },
    features: {
      title: "Key Features",
      items: [
        {
          title: "Innovative Solution",
          description: businessIdea?.description || "Transform your business with our cutting-edge solution."
        },
        {
          title: "Tailored For You",
          description: `Specifically designed for ${targetAudience?.demographics || 'our customers'}.`
        },
        {
          title: "Proven Results",
          description: "Join our satisfied customers and see the difference."
        }
      ]
    },
    benefits: {
      title: "Benefits",
      items: targetAudience?.painPoints?.map((point: string) => ({
        title: "Problem Solved",
        description: point
      })) || []
    },
    testimonials: [
      {
        quote: "This solution transformed our business operations.",
        author: "Satisfied Customer",
        role: targetAudience?.demographics || "Business Owner"
      }
    ],
    cta: {
      title: "Ready to Get Started?",
      description: "Join us today and experience the difference.",
      buttonText: "Start Now"
    }
  };
};

const generateIterativeContent = async (
  projectId: string,
  businessIdea: any,
  targetAudience: any,
  currentContent?: any,
  isRefinement = false
) => {
  try {
    const prompt = `
      Create engaging landing page content for this business:
      
      Business Idea: ${JSON.stringify(businessIdea)}
      Target Audience: ${JSON.stringify(targetAudience)}
      ${isRefinement ? `Current Content to Improve: ${JSON.stringify(currentContent)}` : ''}
      
      Generate a complete landing page content structure with the following sections:
      1. Hero section with compelling headline, description, and CTA
      2. Features section highlighting key benefits
      3. Benefits section addressing pain points
      4. Testimonials that resonate with the target audience
      5. Final call-to-action section
      
      Make the content engaging, persuasive, and specifically tailored to the target audience.
      Focus on the unique value proposition and benefits.
      Use a professional, conversion-focused tone.
      
      Return the content in a structured JSON format.
    `;
    
    const content = await generateLandingPageContent(prompt);
    console.log("Successfully generated landing page content");
    
    try {
      // Try to parse the response as JSON
      return JSON.parse(content);
    } catch (parseError) {
      console.error("❌ Error parsing GPT response as JSON:", parseError);
      // If parsing fails, return the basic content structure
      return generateBasicContent(businessIdea, targetAudience);
    }
  } catch (error) {
    console.error("❌ Error generating content:", error);
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
