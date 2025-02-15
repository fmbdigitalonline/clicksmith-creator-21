
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";
import Replicate from "https://esm.sh/replicate@0.25.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessIdea, targetAudience, audienceAnalysis, projectImages = [] } = await req.json();

    // Initialize OpenAI
    const openai = new OpenAIApi(new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    }));

    // Generate landing page content using GPT
    console.log("Generating landing page content...");
    const contentPrompt = `
      Create a compelling landing page content based on this business information:
      Business Idea: ${JSON.stringify(businessIdea)}
      Target Audience: ${JSON.stringify(targetAudience)}
      Audience Analysis: ${JSON.stringify(audienceAnalysis)}

      Generate content for these sections:
      1. Hero section with headline and subheadline
      2. Value proposition section with 3 key benefits
      3. Features section with 3-4 main features
      4. Social proof/testimonials section with 2-3 testimonials
      5. Call to action section

      Format the response as a JSON object with these sections.
    `;

    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a landing page content expert. Create compelling, conversion-focused content."
        },
        {
          role: "user",
          content: contentPrompt
        }
      ]
    });

    const generatedContent = JSON.parse(completion.data.choices[0].message.content);

    // If no project images were provided, generate a hero image using Replicate
    if (projectImages.length === 0) {
      console.log("No project images found, generating hero image with Replicate...");
      
      const replicate = new Replicate({
        auth: Deno.env.get('REPLICATE_API_KEY'),
      });

      const imagePrompt = `Ultra realistic commercial photograph, professional DSLR quality, 8k resolution, crystal clear, highly detailed commercial photography for this business: ${JSON.stringify(businessIdea)}`;

      console.log("Generating image with prompt:", imagePrompt);
      
      const output = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            prompt: imagePrompt,
            width: 1024,
            height: 1024,
            num_outputs: 1,
            guidance_scale: 7.5,
            num_inference_steps: 50,
            negative_prompt: "cartoon, illustration, painting, drawing, art, digital art, anime, manga, low quality, blurry, watermark, text, logo"
          }
        }
      );

      console.log("Replicate response:", output);
      
      // Replicate returns an array of URLs, we take the first one
      generatedContent.hero.image = Array.isArray(output) ? output[0] : output;
    } else {
      // Use the first saved project image
      generatedContent.hero.image = projectImages[0];
    }

    // Add layout and styling information
    const layout = {
      hero: "centered",
      features: "grid",
      testimonials: "carousel",
    };

    const imagePlacements = {
      hero: "background",
      features: "side",
    };

    return new Response(
      JSON.stringify({
        ...generatedContent,
        layout,
        imagePlacements,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );

  } catch (error) {
    console.error('Error in generate-landing-page function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
