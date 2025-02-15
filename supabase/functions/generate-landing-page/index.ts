
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

    const { businessIdea, targetAudience, audienceAnalysis, marketingCampaign, projectImages = [] } = body;

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
      marketingCampaign,
      hasProjectImages: projectImages.length > 0
    });

    const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!apiKey) {
      console.error("DEEPSEEK_API_KEY is not set");
      throw new Error("API key configuration is missing");
    }

    // Direct fetch to DeepSeek API for better control
    async function createDeepSeekCompletion(messages) {
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

      return response.json();
    }

    // Generate main content following AIDA framework with comprehensive details
    const contentPrompt = `Create a comprehensive, high-converting landing page content for ${businessIdea.description || businessIdea.name}. 
    
Input Data:
${JSON.stringify({ businessIdea, targetAudience, audienceAnalysis }, null, 2)}

Generate a detailed JSON object with these exact sections, focusing on persuasive marketing copy and clear value propositions:

{
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
    "concerns": [
      { "question": string, "answer": string }
    ]
  },
  "faq": {
    "questions": [
      { "question": string, "answer": string }
    ]
  }
}

Follow these rules:
1. Make content compelling and focused on benefits
2. Use professional, persuasive tone
3. Address specific pain points from the audience analysis
4. Include detailed features and their benefits
5. Make all content relevant to the business idea and target audience
6. Create testimonials that reflect real use cases
7. Address common objections thoroughly
8. Include comprehensive FAQ section`;

    console.log("Generating content with prompt:", contentPrompt);

    let aidaContent;
    try {
      const completion = await createDeepSeekCompletion([
        {
          role: "system",
          content: "You are an expert landing page copywriter specializing in high-converting content. Create compelling content following the AIDA framework and modern marketing best practices. Return only valid JSON matching the exact structure specified."
        },
        {
          role: "user",
          content: contentPrompt
        }
      ]);

      console.log("Raw DeepSeek response:", completion);
      
      if (!completion.choices?.[0]?.message?.content) {
        throw new Error("Invalid response format from DeepSeek");
      }

      aidaContent = JSON.parse(completion.choices[0].message.content);
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

    // Generate hero section with better error handling
    let heroContent;
    try {
      const heroPrompt = `Create a compelling hero section for:
Business: ${businessIdea.description}
Target Audience: ${JSON.stringify(targetAudience)}
Value Proposition: ${businessIdea.valueProposition}

Return JSON with exact structure:
{
  "headline": string,
  "subtitle": string
}

Make it highly persuasive and focused on the main value proposition.`;

      const heroCompletion = await createDeepSeekCompletion([
        {
          role: "system",
          content: "You are an expert copywriter specializing in hero sections that convert. Return only valid JSON with the exact structure specified."
        },
        {
          role: "user",
          content: heroPrompt
        }
      ]);

      heroContent = JSON.parse(heroCompletion.choices[0].message.content);
      console.log("Generated hero content:", heroContent);
    } catch (error) {
      console.error("Error generating hero content:", error);
      heroContent = {
        headline: "Transform Your Business Ideas into Reality",
        subtitle: "Get the professional guidance you need to succeed"
      };
    }

    // Handle hero image generation with emphasis on realism
    let heroImage;
    try {
      console.log("Generating hero image...");
      const replicate = new Replicate({
        auth: Deno.env.get('REPLICATE_API_KEY'),
      });

      // Add random seed and realistic style variations
      const styles = [
        "professional DSLR photography",
        "natural studio lighting",
        "real commercial photography",
        "professional corporate photo",
        "high-end business photography"
      ];
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];
      const randomSeed = Math.floor(Math.random() * 1000000);

      const imagePrompt = `Create a strictly photorealistic commercial photograph. The image must be indistinguishable from a professional DSLR camera shot, with absolutely no artistic or illustrated elements. ${heroContent.headline}. ${heroContent.subtitle}. Style: ${randomStyle}. Critical requirements: crystal clear focus, natural lighting, realistic shadows, professional studio quality, commercial photography standards.`;
      
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
      hero: {
        title: heroContent?.headline || "Transform Your Business",
        description: heroContent?.subtitle || "Get started with our professional solution",
        cta: "Get Started Now",
        image: heroImage
      },
      ...aidaContent,
      cta: {
        title: "Ready to Get Started?",
        description: "Join us today and transform your business.",
        buttonText: "Get Started Now"
      },
      footerContent: {
        contact: "Contact us for support",
        newsletter: "Subscribe to our newsletter",
        copyright: `© ${new Date().getFullYear()} All rights reserved.`
      }
    };

    console.log("Successfully generated content, preparing response");

    const response = new Response(
      JSON.stringify(generatedContent),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

    console.log("Sending response:", response.status);
    return response;

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
