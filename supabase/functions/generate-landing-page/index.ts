
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

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

    // If no project images were provided, generate a hero image
    if (projectImages.length === 0) {
      console.log("No project images found, generating hero image...");
      const imagePrompt = `
        Create a professional and modern hero image for this business:
        ${JSON.stringify(businessIdea)}
        Style: Modern, professional, high-quality marketing image
        Make it suitable for a hero section of a landing page.
      `;

      const imageCompletion = await openai.createImage({
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        response_format: "url",
      });

      generatedContent.hero.image = imageCompletion.data.data[0].url;
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
