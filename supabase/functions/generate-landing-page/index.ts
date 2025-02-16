
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { businessIdea, targetAudience, audienceAnalysis, projectImages = [] } = body;

    if (!businessIdea) {
      return new Response(
        JSON.stringify({ error: 'Business idea is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is not set");
    }

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
            content: `Create a theme for: ${JSON.stringify({ businessIdea, targetAudience })}. Return only JSON with colorScheme (primary, secondary, accent, background colors), typography (headingFont, bodyFont, style), mood, and visualStyle.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!themeResponse.ok) {
      throw new Error(`Theme generation failed: ${themeResponse.statusText}`);
    }

    const themeResult = await themeResponse.json();
    const theme = JSON.parse(themeResult.choices[0].message.content);

    // Generate landing page content
    const contentResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
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
            content: "You are an expert landing page copywriter."
          },
          {
            role: "user",
            content: `Create landing page content for: ${JSON.stringify({ businessIdea, targetAudience, audienceAnalysis })}. Include hero, howItWorks, marketAnalysis, valueProposition, features, testimonials, objections, faq, cta, and footerContent sections.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!contentResponse.ok) {
      throw new Error(`Content generation failed: ${contentResponse.statusText}`);
    }

    const contentResult = await contentResponse.json();
    const landingContent = JSON.parse(contentResult.choices[0].message.content);

    // Generate hero image
    let heroImage = null;
    try {
      const replicate = new Replicate({
        auth: Deno.env.get('REPLICATE_API_KEY'),
      });

      const output = await replicate.run(
        "black-forest-labs/flux-1.1-pro",
        {
          input: {
            prompt: `Professional commercial photo for: ${landingContent.hero.title}. Style: ${theme.visualStyle}`,
            negative_prompt: "cartoon, illustration, painting, drawing, art, digital art, anime, manga, low quality, blurry",
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
    } catch (error) {
      console.error("Hero image generation failed:", error);
    }

    // Combine content with metadata
    const generatedContent = {
      ...landingContent,
      hero: {
        ...landingContent.hero,
        image: heroImage
      },
      theme,
      layout: "centered",
      section_order: [
        "hero",
        "value_proposition",
        "how_it_works",
        "market_analysis",
        "features",
        "testimonials",
        "objections",
        "faq",
        "cta",
        "footer"
      ],
      conversion_goals: [
        "sign_up",
        "contact_form",
        "newsletter",
        "demo_request",
        "download"
      ],
      image_placements: projectImages.map((url: string, index: number) => ({
        url,
        section: ["features", "valueProposition", "proof"][index % 3]
      })),
      styling: {
        ...theme,
        layout_preferences: {
          contentWidth: "max-w-6xl",
          spacing: {
            sectionPadding: "py-16 md:py-24",
            elementSpacing: "space-y-8",
            contentGap: "gap-8"
          },
          responsive: {
            breakpoints: {
              sm: "640px",
              md: "768px",
              lg: "1024px",
              xl: "1280px"
            }
          }
        },
        components: {
          buttons: {
            primary: "bg-primary-600 hover:bg-primary-700",
            secondary: "bg-secondary-500 hover:bg-secondary-600"
          },
          cards: {
            default: "bg-white shadow-md rounded-lg p-6",
            featured: "bg-primary-50 shadow-lg rounded-lg p-8"
          }
        },
        animations: {
          transition: "transition-all duration-300",
          hover: "transform hover:scale-105",
          fade: "animate-fade-in"
        }
      }
    };

    return new Response(
      JSON.stringify(generatedContent),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred during landing page generation'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
