
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIKey = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SuggestionRequest {
  type: "targeting" | "budget" | "objective" | "performance";
  businessIdea?: any;
  targetAudience?: any;
  audienceAnalysis?: any;
  currentValue?: string | number;
}

interface SuggestionResponse {
  suggestion: string;
  explanation: string;
  confidence: "high" | "medium" | "low";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const request = await req.json() as SuggestionRequest;
    console.log("Received request type:", request.type);
    
    let prompt = "";
    let systemPrompt = "";
    
    switch (request.type) {
      case "targeting":
        systemPrompt = `You are a Facebook advertising expert specializing in audience targeting. 
                        Provide concise, specific targeting suggestions based on business and audience data.
                        Your suggestions should be practical, specific, and directly applicable to Facebook's targeting system.
                        Include demographic, interest, and behavioral targeting recommendations where possible.`;
        prompt = generateTargetingPrompt(request);
        break;
      case "budget":
        systemPrompt = `You are a Facebook advertising budget optimization expert. 
                        Suggest optimal daily budget based on business data and industry benchmarks.
                        Consider factors like audience size, industry competition, and campaign objectives.
                        Provide practical budget recommendations with clear justification.`;
        prompt = generateBudgetPrompt(request);
        break;
      case "objective":
        systemPrompt = `You are a Facebook ad campaign objective specialist. 
                        Recommend the most suitable campaign objective based on business goals and target audience.
                        Consider the business's industry, current stage, and specific objectives.
                        Prioritize objectives that will deliver the best results for their specific case.`;
        prompt = generateObjectivePrompt(request);
        break;
      case "performance":
        systemPrompt = `You are a Facebook ad performance prediction expert. 
                        Forecast potential campaign performance based on industry benchmarks and provided data.
                        Include specific metrics like estimated CTR ranges, conversion rate expectations, and cost metrics.
                        Clearly explain the factors that influence these predictions.`;
        prompt = generatePerformancePrompt(request);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid suggestion type" }),
          { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
    }
    
    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 500,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${error}`);
    }
    
    const result = await response.json();
    const aiResponse = result.choices[0].message.content;
    
    // Parse the AI response
    const suggestionResponse = parseAIResponse(aiResponse, request.type);
    
    return new Response(
      JSON.stringify(suggestionResponse),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

function generateTargetingPrompt(request: SuggestionRequest): string {
  const { businessIdea, targetAudience, audienceAnalysis } = request;
  
  return `
Please provide Facebook ad targeting recommendations based on this data:

Business information:
${JSON.stringify(businessIdea || {}, null, 2)}

Target audience details:
${JSON.stringify(targetAudience || {}, null, 2)}

Audience analysis:
${JSON.stringify(audienceAnalysis || {}, null, 2)}

Format your response exactly like this:
Suggestion: [1-2 sentence specific targeting recommendation]
Explanation: [3-4 sentence explanation with reasoning]
Confidence: [high/medium/low based on data quality]
`;
}

function generateBudgetPrompt(request: SuggestionRequest): string {
  const { businessIdea, targetAudience, currentValue } = request;
  
  return `
Please recommend an optimal daily Facebook ad budget based on this information:

Business information:
${JSON.stringify(businessIdea || {}, null, 2)}

Target audience details:
${JSON.stringify(targetAudience || {}, null, 2)}

Current budget consideration: ${currentValue || "None provided"}

Format your response exactly like this:
Suggestion: [specific daily budget amount in dollars, just the number]
Explanation: [3-4 sentence explanation with reasoning]
Confidence: [high/medium/low based on data quality]
`;
}

function generateObjectivePrompt(request: SuggestionRequest): string {
  const { businessIdea, targetAudience } = request;
  
  return `
Please recommend the most suitable Facebook campaign objective based on this data:

Business information:
${JSON.stringify(businessIdea || {}, null, 2)}

Target audience details:
${JSON.stringify(targetAudience || {}, null, 2)}

Choose from these Facebook objectives: AWARENESS, TRAFFIC, ENGAGEMENT, LEADS, CONVERSIONS, SALES

Format your response exactly like this:
Suggestion: [single Facebook objective from the list above]
Explanation: [3-4 sentence explanation with reasoning]
Confidence: [high/medium/low based on data quality]
`;
}

function generatePerformancePrompt(request: SuggestionRequest): string {
  const { businessIdea, targetAudience, audienceAnalysis } = request;
  
  return `
Please predict potential performance metrics for a Facebook ad campaign based on this data:

Business information:
${JSON.stringify(businessIdea || {}, null, 2)}

Target audience details:
${JSON.stringify(targetAudience || {}, null, 2)}

Audience analysis:
${JSON.stringify(audienceAnalysis || {}, null, 2)}

Format your response exactly like this:
Suggestion: [key performance prediction, including estimated CTR range, conversion rate range, or other relevant metrics]
Explanation: [3-4 sentence explanation with reasoning]
Confidence: [high/medium/low based on data quality]
`;
}

function parseAIResponse(response: string, type: string): SuggestionResponse {
  try {
    // Extract sections using regex
    const suggestionMatch = response.match(/Suggestion: (.*?)(?=\n|Explanation:|$)/s);
    const explanationMatch = response.match(/Explanation: (.*?)(?=\n|Confidence:|$)/s);
    const confidenceMatch = response.match(/Confidence: (.*?)(?=\n|$)/s);
    
    // Default values in case parsing fails
    const defaultResponse: SuggestionResponse = {
      suggestion: "Unable to generate a specific suggestion with the provided data.",
      explanation: "Consider providing more detailed information for better recommendations.",
      confidence: "low"
    };
    
    // Type-specific default suggestions
    const typeDefaults: Record<string, string> = {
      targeting: "Consider targeting based on demographics and interests relevant to your business.",
      budget: type === "budget" ? "20" : "Consider a moderate budget based on your campaign goals.",
      objective: "AWARENESS",
      performance: "Expect industry-average performance metrics for your campaign."
    };
    
    // Parse the matches
    const suggestion = suggestionMatch && suggestionMatch[1] 
      ? suggestionMatch[1].trim() 
      : typeDefaults[type] || defaultResponse.suggestion;
      
    const explanation = explanationMatch && explanationMatch[1] 
      ? explanationMatch[1].trim() 
      : defaultResponse.explanation;
      
    const confidenceRaw = confidenceMatch && confidenceMatch[1] 
      ? confidenceMatch[1].trim().toLowerCase() 
      : "low";
      
    // Validate confidence value
    const confidence = ["high", "medium", "low"].includes(confidenceRaw) 
      ? confidenceRaw as "high" | "medium" | "low" 
      : "low";
    
    return {
      suggestion,
      explanation,
      confidence
    };
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return {
      suggestion: "Could not parse suggestion",
      explanation: "There was an error processing the AI response.",
      confidence: "low"
    };
  }
}
