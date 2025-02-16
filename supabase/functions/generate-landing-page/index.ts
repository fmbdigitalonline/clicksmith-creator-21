
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

    // First, generate theme preferences based on business and audience
    const themePrompt = `Based on this business:
    ${JSON.stringify({ businessIdea, targetAudience, audienceAnalysis }, null, 2)}
    
    Generate a JSON object for the visual theme that would best represent this business and connect with their target audience. Include:
    {
      "colorScheme": {
        "primary": string (color name),
        "secondary": string (color name),
        "accent": string (color name),
        "background": string (color name)
      },
      "typography": {
        "headingFont": string (specify a Google Font that fits the brand),
        "bodyFont": string (specify a complementary Google Font),
        "style": string (describe the typography style)
      },
      "mood": string (describe the overall mood/feeling),
      "visualStyle": string (describe the visual style approach)
    }
    
    Consider the business type, target audience preferences, and overall brand personality. Be creative but ensure the theme is professional and appropriate for the business context.
    
    IMPORTANT: Return ONLY valid JSON matching this exact structure. No markdown, no explanation.`;

    console.log("Generating theme with prompt:", themePrompt);

    // Generate theme preferences
    const themeResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { 
            role: "system", 
            content: "You are an expert UI/UX designer specializing in creating cohesive visual themes for businesses."
          },
          { 
            role: "user", 
            content: themePrompt 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!themeResponse.ok) {
      throw new Error(`Theme generation failed: ${themeResponse.statusText}`);
    }

    const themeData = await themeResponse.json();
    const theme = JSON.parse(themeData.choices[0].message.content);
    
    console.log("Generated theme:", theme);

    // Now generate the content with the theme in mind
    const contentPrompt = `Create a landing page content for ${businessIdea.description || businessIdea.name} that reflects this visual theme and mood:
    ${JSON.stringify(theme, null, 2)}
    
    Input Data:
    ${JSON.stringify({ businessIdea, targetAudience, audienceAnalysis }, null, 2)}
    
    Generate a JSON object with these exact sections while maintaining the specified mood and visual style:
    
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

    let aidaContent;
    try {
      aidaContent = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: "system",
              content: "You are an expert landing page copywriter. Create compelling content following the AIDA framework while maintaining the specified mood and visual style."
            },
            {
              role: "user",
              content: contentPrompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      }).then(res => res.json())
      .then(data => JSON.parse(data.choices[0].message.content));
      
      console.log("Generated AIDA content:", aidaContent);
    } catch (error) {
      console.error("Error generating AIDA content:", error);
      throw new Error("Failed to generate landing page content: " + error.message);
    }

    // Handle hero image generation with theme-aware prompt
    let heroImage = null;
    try {
      console.log("Generating hero image...");
      const replicate = new Replicate({
        auth: Deno.env.get('REPLICATE_API_KEY'),
      });

      const imagePrompt = `Create a strictly photorealistic commercial photograph that reflects this mood: ${theme.mood}. The image must be indistinguishable from a professional DSLR camera shot, with absolutely no artistic or illustrated elements. ${aidaContent.hero.title}. ${aidaContent.hero.description}. Style: ${theme.visualStyle}. Critical requirements: crystal clear focus, natural lighting, realistic shadows, professional studio quality, commercial photography standards.`;
      
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
            seed: Math.floor(Math.random() * 1000000),
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

    // Combine all content with theme
    const generatedContent = {
      ...aidaContent,
      hero: {
        ...aidaContent.hero,
        image: heroImage
      },
      theme,
      layout: "centered",
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
