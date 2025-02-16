
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.20.1";
import Replicate from "https://esm.sh/replicate@0.25.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Request received, method:", req.method);
    
    // Safely parse the request body
    let body;
    try {
      const text = await req.text();
      console.log("Raw request body:", text);
      body = JSON.parse(text);
      console.log("Parsed request body:", body);
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          details: error.message 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { businessIdea, targetAudience, audienceAnalysis, projectImages = [] } = body;

    if (!businessIdea) {
      console.error("Missing business idea in request");
      return new Response(
        JSON.stringify({ error: 'Business idea is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("Starting landing page generation with:", {
      businessIdea,
      targetAudience,
      audienceAnalysis,
      hasProjectImages: projectImages.length > 0
    });

    const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!apiKey) {
      console.error("DEEPSEEK_API_KEY is not set");
      throw new Error("API key configuration is missing");
    }

    // Direct fetch to DeepSeek API for better control
    async function createDeepSeekCompletion(messages: any) {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('DeepSeek API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: text
        });
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${text}`);
      }

      const data = await response.json();
      console.log("Raw DeepSeek response:", data);
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from DeepSeek');
      }

      try {
        // Clean up the response content and parse as JSON
        const content = data.choices[0].message.content.trim();
        console.log("Content before parsing:", content);
        
        // Remove any markdown formatting if present
        const cleanContent = content
          .replace(/```json\s*/g, '')
          .replace(/```\s*$/g, '')
          .trim();
        
        const parsedContent = JSON.parse(cleanContent);
        console.log("Parsed content:", parsedContent);
        return parsedContent;
      } catch (error) {
        console.error("Error parsing DeepSeek response:", error);
        console.error("Raw content:", data.choices[0].message.content);
        throw new Error(`Failed to parse DeepSeek response: ${error.message}`);
      }
    }

    // Generate main content following AIDA framework
    const contentPrompt = `Create a landing page content for ${businessIdea.description || businessIdea.name}. 
    
Input Data:
${JSON.stringify({ businessIdea, targetAudience, audienceAnalysis }, null, 2)}

Generate a JSON object with these exact sections:

{
  "hero": {
    "title": string,
    "description": string,
    "cta": string
  },
  "howItWorks": {
    "steps": [
      { "title": string, "description": string }
    ],
    "valueReinforcement": string
  },
  "marketAnalysis": {
    "context": string,
    "solution": string,
    "painPoints": [
      { "title": string, "description": string }
    ],
    "features": [
      { "title": string, "description": string }
    ]
  },
  "valueProposition": {
    "title": string,
    "cards": [
      { "title": string, "description": string }
    ]
  },
  "features": {
    "description": string,
    "items": [
      { "title": string, "description": string }
    ]
  },
  "testimonials": {
    "items": [
      { "quote": string, "author": string, "role": string }
    ]
  },
  "objections": {
    "subheadline": string,
    "concerns": [
      { "question": string, "answer": string }
    ]
  },
  "cta": {
    "title": string,
    "description": string,
    "buttonText": string
  }
}

IMPORTANT: Return ONLY valid JSON with these exact fields and nothing else. No markdown, no backticks.`;

    console.log("Generating content with prompt:", contentPrompt);

    let aidaContent;
    try {
      aidaContent = await createDeepSeekCompletion([
        {
          role: "system",
          content: "You are an expert landing page copywriter. Create compelling content following the AIDA framework. Return only valid JSON matching the exact structure specified."
        },
        {
          role: "user",
          content: contentPrompt
        }
      ]);
      console.log("Generated AIDA content:", aidaContent);
    } catch (error) {
      console.error("Error generating AIDA content:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw new Error("Failed to generate landing page content: " + error.message);
    }

    // Handle hero image generation
    let heroImage = null;
    try {
      console.log("Generating hero image...");
      const replicate = new Replicate({
        auth: Deno.env.get('REPLICATE_API_KEY'),
      });

      const styles = [
        "professional DSLR photography",
        "natural studio lighting",
        "real commercial photography",
        "professional corporate photo",
        "high-end business photography"
      ];
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];
      const randomSeed = Math.floor(Math.random() * 1000000);

      const imagePrompt = `Create a strictly photorealistic commercial photograph. The image must be indistinguishable from a professional DSLR camera shot, with absolutely no artistic or illustrated elements. ${aidaContent.hero.title}. ${aidaContent.hero.description}. Style: ${randomStyle}. Critical requirements: crystal clear focus, natural lighting, realistic shadows, professional studio quality, commercial photography standards.`;
      
      console.log("Image generation prompt:", imagePrompt);

      const output = await replicate.run(
        "black-forest-labs/flux-1.1-pro",
        {
          input: {
            prompt: imagePrompt,
            negative_prompt: "cartoon, illustration, painting, drawing, art, digital art, anime, manga, low quality, blurry, watermark, text, logo, artificial, AI-generated, unrealistic, distorted, deformed",
            width: 1024,
            height: 1024,
            num_outputs: 1,
            seed: randomSeed,
            go_fast: true,
            megapixels: "1",
            aspect_ratio: "1:1",
            output_format: "webp",
            output_quality: 90,
            num_inference_steps: 4
          }
        }
      );

      heroImage = Array.isArray(output) ? output[0] : output;
      console.log("Generated hero image URL:", heroImage);
    } catch (error) {
      console.error("Error generating hero image:", error);
      heroImage = null;
    }

    // Combine all content
    const generatedContent = {
      ...aidaContent,
      hero: {
        ...aidaContent.hero,
        image: heroImage
      },
      layout: "centered", // Default layout
      imagePlacements: projectImages.map((url: string, index: number) => ({
        url,
        section: ["features", "valueProposition", "proof"][index % 3]
      }))
    };

    console.log("Final generated content:", generatedContent);

    return new Response(
      JSON.stringify(generatedContent),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in generate-landing-page function:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
        type: error.constructor.name
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
