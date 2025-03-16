
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../generate-ad-content/handlers/utils/corsHeaders.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

if (!OPENAI_API_KEY) {
  throw new Error("Missing OpenAI API key");
}

interface RequestPayload {
  businessIdea: {
    description: string;
    valueProposition: string;
  };
  regenerationCount?: number;
  forceRegenerate?: boolean;
}

interface EnhancedPersona {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  values: string[];
  strengths: string[];
  weaknesses: string[];
  demographics: string;
  psychographics: string;
  behavioralTraits: string[];
  goals: string[];
  challenges: string[];
  mediaPreferences: string[];
  purchaseDrivers: string[];
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request payload
    const payload: RequestPayload = await req.json();
    const { businessIdea, regenerationCount = 0, forceRegenerate = false } = payload;

    if (!businessIdea || !businessIdea.description) {
      return new Response(
        JSON.stringify({
          error: "Business idea description is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Generating enhanced personas with params:", {
      businessIdea,
      regenerationCount,
      forceRegenerate,
    });

    // Generate enhanced personas using OpenAI
    const personas = await generateEnhancedPersonas(
      businessIdea,
      regenerationCount,
      forceRegenerate
    );

    // Return successful response
    return new Response(JSON.stringify({ personas }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-enhanced-personas:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function generateEnhancedPersonas(
  businessIdea: RequestPayload["businessIdea"],
  regenerationCount = 0,
  forceRegenerate = false
): Promise<EnhancedPersona[]> {
  const prompt = `Generate 9 distinct target audience personas for a business idea: ${businessIdea.description}. 
  ${businessIdea.valueProposition ? `Value proposition: ${businessIdea.valueProposition}` : ''} 
  ${forceRegenerate ? `Make these different from previous generations (variation ${regenerationCount}).` : ''}
  
  Each persona should represent a different segment of potential customers with unique attributes, behaviors, and needs.
  For each persona, provide:
  
  1. A unique, memorable name and brief description
  2. 3-5 key characteristics that define them
  3. Their core values (3-5 items)
  4. Strengths and weaknesses (3 each)
  5. Detailed demographics (age range, gender, location, income, education, occupation)
  6. Psychographics (lifestyle, interests, hobbies, beliefs)
  7. 3-5 behavioral traits that influence purchasing decisions
  8. 2-3 primary goals
  9. 2-4 challenges or pain points they face
  10. Media consumption preferences and channels
  11. 3-4 key purchase drivers
  
  Format the response as a JSON array with 9 objects, each containing:
  {
    "id": "unique-id-string",
    "name": "Persona Name",
    "description": "Brief description of this persona",
    "characteristics": ["trait1", "trait2", "trait3"],
    "values": ["value1", "value2", "value3"],
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2", "weakness3"],
    "demographics": "Detailed demographic information",
    "psychographics": "Detailed psychographic information",
    "behavioralTraits": ["trait1", "trait2", "trait3"],
    "goals": ["goal1", "goal2"],
    "challenges": ["challenge1", "challenge2", "challenge3"],
    "mediaPreferences": ["channel1", "channel2", "channel3"],
    "purchaseDrivers": ["driver1", "driver2", "driver3"]
  }`;

  try {
    console.log("Calling OpenAI API to generate enhanced personas");
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert marketing strategist and consumer psychologist specializing in audience research and segmentation. Always respond with valid JSON array containing exactly 9 detailed audience personas.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: forceRegenerate ? 0.9 : 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error response:", errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("OpenAI response received");

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from OpenAI");
    }

    const generatedText = data.choices[0].message.content;
    
    try {
      // Clean up the response before parsing
      const cleanedText = generatedText.replace(/```json\n?|\n?```/g, "").trim();
      
      // Try to parse the response as JSON
      const parsedPersonas = JSON.parse(cleanedText);
      
      // Validate the structure of the parsed data
      if (!Array.isArray(parsedPersonas) || parsedPersonas.length !== 9) {
        throw new Error("Generated content is not an array of 9 personas");
      }

      // Validate each persona object has required fields
      parsedPersonas.forEach((persona, index) => {
        // Add an ID if not present
        if (!persona.id) {
          persona.id = `persona-${index + 1}`;
        }
        
        const requiredFields = [
          "name", "description", "characteristics", "values", 
          "strengths", "weaknesses", "demographics", "psychographics",
          "behavioralTraits", "goals", "challenges", "mediaPreferences",
          "purchaseDrivers"
        ];

        const missingFields = requiredFields.filter(field => !persona[field]);
        if (missingFields.length > 0) {
          throw new Error(`Persona ${index + 1} is missing required fields: ${missingFields.join(", ")}`);
        }

        // Validate array fields
        const arrayFields = [
          "characteristics", "values", "strengths", "weaknesses",
          "behavioralTraits", "goals", "challenges", "mediaPreferences",
          "purchaseDrivers"
        ];
        
        arrayFields.forEach(field => {
          if (!Array.isArray(persona[field])) {
            persona[field] = persona[field] ? [persona[field]] : [];
          }
        });
      });

      console.log("Successfully generated and validated enhanced personas");
      return parsedPersonas;
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.error("Raw response:", generatedText);
      throw new Error(`Failed to parse generated personas: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error in generateEnhancedPersonas:", error);
    throw error;
  }
}
