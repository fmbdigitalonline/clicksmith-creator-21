
import { corsHeaders } from "../_shared/cors.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.20.1/mod.ts";

const openAI = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const cleanJsonResponse = (content: string): string => {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1];
  }
  return content;
};

const generateLandingPageContent = async (prompt: string) => {
  try {
    console.log("Generating content with GPT-4...");
    const chatCompletion = await openAI.chat.completions.create({
      model: "gpt-4",  // Changed from gpt-4o-mini to gpt-4
      messages: [
        {
          role: "system",
          content: "You are a landing page content expert. Return ONLY valid JSON without any markdown formatting, code blocks, or additional text."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });
    
    const content = chatCompletion.choices[0].message.content;
    console.log("Raw content from GPT:", content);
    
    const cleanedContent = cleanJsonResponse(content);
    console.log("Cleaned content:", cleanedContent);
    
    return cleanedContent;
  } catch (error) {
    console.error("❌ OpenAI API error:", error);
    throw error;
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, businessIdea, targetAudience, businessName } = await req.json();
    
    if (!projectId || !businessIdea || !targetAudience) {
      throw new Error("Missing required fields");
    }

    console.log("Generating content for project:", projectId);

    const prompt = `
      Create a compelling landing page content for this business:
      Business Name: ${businessName}
      Business Idea: ${JSON.stringify(businessIdea)}
      Target Audience: ${JSON.stringify(targetAudience)}

      Return a JSON object with this EXACT structure:
      {
        "hero": {
          "title": "compelling headline",
          "description": "engaging description",
          "ctaText": "call to action text"
        },
        "features": [
          {
            "title": "feature name",
            "description": "feature description"
          }
        ],
        "benefits": [
          {
            "title": "benefit name",
            "description": "benefit description"
          }
        ],
        "testimonials": [
          {
            "quote": "testimonial text",
            "author": "author name",
            "role": "author role"
          }
        ],
        "faq": {
          "items": [
            {
              "question": "question text",
              "answer": "answer text"
            }
          ]
        },
        "cta": {
          "title": "call to action title",
          "description": "compelling message",
          "buttonText": "action text"
        }
      }

      Make the content highly specific to the business and target audience.
      Include at least:
      - 3 unique features
      - 3 compelling benefits
      - 2 realistic testimonials
      - 3 relevant FAQ items
    `;

    const content = await generateLandingPageContent(prompt);
    let parsedContent;
    
    try {
      parsedContent = JSON.parse(content);
      console.log("Successfully parsed content:", parsedContent);
    } catch (parseError) {
      console.error("Failed to parse content:", parseError);
      throw new Error("Failed to generate valid content");
    }

    const theme_settings = {
      heroLayout: "centered",
      featuresLayout: "grid",
      benefitsLayout: "grid",
      testimonialsLayout: "grid",
      pricingLayout: "grid",
    };

    return new Response(
      JSON.stringify({
        content: parsedContent,
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
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
