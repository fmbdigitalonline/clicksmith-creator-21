
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

    // First, generate the hero section content using AIDA formula
    console.log("Generating hero content with AIDA formula...");
    const heroPrompt = `
      Write a compelling headline and subtitle combination for a landing page that promotes ${businessIdea.name || businessIdea.description || 'this business'}. The content should follow the AIDA formula (Attention, Interest, Desire, Action) and adhere to the following guidelines:

      Attention (Headline):
      - Grab the reader's attention immediately by addressing a key pain point, desire, or aspiration.
      - Keep it concise (8–12 words).
      - Use emotional hooks (e.g., fear of failure, excitement about success, curiosity).
      - Highlight the primary benefit or outcome of using the product.

      Interest (Subtitle - First Sentence):
      - Build interest by explaining why the product is relevant to the reader.
      - Mention the versatility of the product if applicable.
      - Use simple, conversational language to make the value proposition clear.
      - Recommended word count: 8–12 words.

      Desire (Subtitle - Second Sentence):
      - Create desire by highlighting the unique features or benefits of the product.
      - Focus on what makes the product stand out.
      - Use persuasive language to make the reader envision the positive outcomes.
      - Recommended word count: 8–12 words.

      Action (Call-to-Action Implication):
      - End with a subtle call-to-action that encourages the next step.
      - Use phrases that nudge toward action.
      - Recommended word count: 4–6 words.

      Business Information:
      ${JSON.stringify(businessIdea)}

      Target Audience:
      ${JSON.stringify(targetAudience)}

      Audience Analysis:
      ${JSON.stringify(audienceAnalysis)}

      Format the response as a JSON object with these fields:
      {
        "headline": "The attention-grabbing headline",
        "subtitle": {
          "interest": "The first sentence building interest",
          "desire": "The second sentence creating desire",
          "action": "The call-to-action phrase"
        }
      }
    `;

    const heroCompletion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert copywriter specializing in landing page headlines that convert. You create compelling, AIDA-formula headlines that grab attention and drive action."
        },
        {
          role: "user",
          content: heroPrompt
        }
      ]
    });

    const heroContent = JSON.parse(heroCompletion.data.choices[0].message.content);

    // Now generate the rest of the landing page content
    console.log("Generating remaining landing page content...");
    const contentPrompt = `
      Create compelling landing page content based on this business information:
      Business Idea: ${JSON.stringify(businessIdea)}
      Target Audience: ${JSON.stringify(targetAudience)}
      Audience Analysis: ${JSON.stringify(audienceAnalysis)}

      Generate content for these sections:
      1. Value proposition section with 3 key benefits
      2. Features section with 3-4 main features
      3. Social proof/testimonials section with 2-3 testimonials
      4. Call to action section

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

    const remainingContent = JSON.parse(completion.data.choices[0].message.content);

    // Combine hero content with remaining content
    const generatedContent = {
      hero: {
        title: heroContent.headline,
        description: `${heroContent.subtitle.interest} ${heroContent.subtitle.desire} ${heroContent.subtitle.action}`,
        cta: heroContent.subtitle.action
      },
      ...remainingContent
    };

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
