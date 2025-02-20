
import { corsHeaders } from "../_shared/cors.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.20.1/mod.ts";

const openAI = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const cleanJsonResponse = (content: string): string => {
  // Remove markdown code blocks if present
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1];
  }
  return content;
};

const generateLandingPageContent = async (prompt: string) => {
  try {
    console.log("Generating content with GPT-4-mini...");
    const chatCompletion = await openAI.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a landing page content expert. Return ONLY valid JSON without any markdown formatting, code blocks, or additional text."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    const content = chatCompletion.choices[0].message.content;
    const cleanedContent = cleanJsonResponse(content);
    console.log("Cleaned content:", cleanedContent);
    return cleanedContent;
  } catch (error) {
    console.error("❌ OpenAI API error:", error);
    throw error;
  }
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
      Create a compelling landing page content for this business. Return ONLY a valid JSON object with this exact structure:
      {
        "hero": {
          "title": "string with compelling headline",
          "description": "string with engaging description",
          "ctaText": "string with call to action"
        },
        "features": {
          "title": "Features and Benefits",
          "items": [
            {
              "title": "string with feature name",
              "description": "string with feature description"
            }
          ]
        },
        "benefits": {
          "title": "Why Choose Us",
          "items": [
            {
              "title": "string with benefit name",
              "description": "string with benefit description"
            }
          ]
        },
        "testimonials": [
          {
            "quote": "string with testimonial text",
            "author": "string with author name",
            "role": "string with author role"
          }
        ],
        "cta": {
          "title": "string with final call to action title",
          "description": "string with compelling final message",
          "buttonText": "string with action text"
        }
      }

      Use this business context to create highly specific, engaging content:
      Business Idea: ${JSON.stringify(businessIdea)}
      Target Audience: ${JSON.stringify(targetAudience)}
      ${isRefinement ? `Current Content to Improve: ${JSON.stringify(currentContent)}` : ''}
      
      Important guidelines:
      1. Make all content extremely specific to the business and target audience
      2. Focus on unique value propositions and clear benefits
      3. Use compelling, action-oriented language
      4. Ensure all text is professional and conversion-focused
      5. Include at least 3 features and 3 benefits
      6. Generate 2-3 realistic testimonials
    `;
    
    const content = await generateLandingPageContent(prompt);
    console.log("Content received from GPT:", content);
    
    try {
      const parsedContent = JSON.parse(content);
      
      // Validate the content structure
      if (!parsedContent.hero || !parsedContent.features || !parsedContent.benefits || 
          !parsedContent.testimonials || !parsedContent.cta) {
        console.error("Generated content missing required sections");
        throw new Error("Invalid content structure");
      }
      
      return parsedContent;
    } catch (parseError) {
      console.error("❌ Error parsing GPT response as JSON:", parseError);
      console.error("Raw content that failed to parse:", content);
      return generateBasicContent(businessIdea, targetAudience);
    }
  } catch (error) {
    console.error("❌ Error generating content:", error);
    return generateBasicContent(businessIdea, targetAudience);
  }
};

const generateBasicContent = (businessIdea: any, targetAudience: any) => {
  const idea = businessIdea?.description || 'our innovative solution';
  const audience = targetAudience?.demographics || 'valued customers';
  const painPoints = targetAudience?.painPoints || ['Efficiency', 'Quality', 'Service'];

  return {
    hero: {
      title: `Transform Your Business with ${idea}`,
      description: `Designed specifically for ${audience}, our solution delivers exceptional results that matter to you.`,
      ctaText: "Get Started Today",
    },
    features: {
      title: "Powerful Features",
      items: [
        {
          title: "Tailored Solutions",
          description: `Specifically designed for ${audience} like you.`
        },
        {
          title: "Proven Results",
          description: "Join our satisfied customers and experience the difference."
        },
        {
          title: "Expert Support",
          description: "Our team is here to ensure your success every step of the way."
        }
      ]
    },
    benefits: {
      title: "Why Choose Us",
      items: painPoints.map(point => ({
        title: `${point} Enhancement`,
        description: `We help you overcome ${point.toLowerCase()} challenges with our innovative approach.`
      }))
    },
    testimonials: [
      {
        quote: `"${idea} has revolutionized how we operate. The results speak for themselves."`,
        author: "John Smith",
        role: audience
      }
    ],
    cta: {
      title: "Ready to Transform Your Business?",
      description: "Join the growing number of satisfied customers who have already made the smart choice.",
      buttonText: "Start Your Journey"
    }
  };
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
