
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.20.1";
import Replicate from "https://esm.sh/replicate@0.25.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const parseOpenAIResponse = (content: string): any => {
  try {
    // First attempt: direct JSON parse
    return JSON.parse(content);
  } catch (e) {
    try {
      // Second attempt: clean markdown and try again
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedContent);
    } catch (e2) {
      console.error('Failed to parse AI response:', content);
      console.error('Parse error:', e2);
      // Return a structured error message
      return {
        error: "Failed to parse AI response",
        content: content
      };
    }
  }
};

// Map AIDA content to template structure with dynamic layout
const mapToTemplateStructure = (aidaContent: any, heroContent: any, heroImage: string) => {
  console.log("Mapping content to template structure");
  
  if (!aidaContent || !heroContent) {
    console.error("Missing required content:", { aidaContent, heroContent });
    throw new Error("Missing required content for template structure");
  }

  return {
    hero: {
      title: heroContent.headline || "Welcome",
      description: `${heroContent.subtitle?.interest || ''} ${heroContent.subtitle?.desire || ''} ${heroContent.subtitle?.action || ''}`.trim(),
      cta: heroContent.subtitle?.action || "Get Started",
      image: heroImage || "",
    },
    valueProposition: {
      title: "Why Choose Us?",
      cards: (aidaContent.marketAnalysis?.painPoints || []).map((point: any, index: number) => ({
        icon: ["✨", "🎯", "💫"][index % 3],
        title: point.title || "Feature",
        description: point.description || "Description"
      }))
    },
    features: {
      title: "Key Features",
      description: aidaContent.marketAnalysis?.solution || "",
      items: (aidaContent.marketAnalysis?.features || []).map((feature: any, index: number) => ({
        title: feature.title || "Feature",
        description: feature.description || "Description"
      }))
    },
    howItWorks: aidaContent.howItWorks || {
      subheadline: "How it works",
      steps: []
    },
    testimonials: {
      title: "What Our Clients Say",
      items: [{
        quote: aidaContent.marketAnalysis?.socialProof?.quote || "Great service!",
        author: aidaContent.marketAnalysis?.socialProof?.author || "Happy Customer",
        role: aidaContent.marketAnalysis?.socialProof?.title || "Customer"
      }]
    },
    marketAnalysis: aidaContent.marketAnalysis || {
      context: "",
      solution: "",
      marketTrends: []
    },
    objections: aidaContent.objections || {
      subheadline: "",
      concerns: []
    },
    faq: aidaContent.faq || {
      subheadline: "",
      questions: []
    },
    cta: {
      title: "Ready to Get Started?",
      description: aidaContent.howItWorks?.valueReinforcement || "Join us today!",
      buttonText: "Get Started Now"
    },
    footerContent: aidaContent.footerContent || {
      contact: "",
      newsletter: "",
      copyright: ""
    }
  };
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessIdea, targetAudience, audienceAnalysis, projectImages = [] } = await req.json();

    if (!businessIdea) {
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
      audienceAnalysis
    });

    // Initialize OpenAI client with base URL and API key
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      return new Response(
        JSON.stringify({ error: 'DEEPSEEK_API_KEY is not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: deepseekApiKey
    });

    // Generate hero content with a more structured prompt
    console.log("Generating hero content...");
    const heroPrompt = {
      business: businessIdea.description || businessIdea.name,
      format: "JSON with headline and subtitle sections",
      framework: "AIDA (Attention, Interest, Desire, Action)",
      requirements: "Create a compelling headline and subtitle"
    };
    console.log("Hero prompt:", JSON.stringify(heroPrompt));

    let heroContent;
    try {
      const heroCompletion = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are an expert copywriter. Return only valid JSON with this structure:
            {
              "headline": "Main attention-grabbing headline",
              "subtitle": {
                "interest": "Interest-building text",
                "desire": "Desire-building text",
                "action": "Call to action text"
              }
            }`
          },
          {
            role: "user",
            content: JSON.stringify(heroPrompt)
          }
        ],
        temperature: 0.7
      });

      console.log("Raw hero response:", heroCompletion.choices[0].message.content);
      heroContent = JSON.parse(heroCompletion.choices[0].message.content);
    } catch (error) {
      console.error("Hero content generation error:", error);
      throw new Error(`Hero content generation failed: ${error.message}`);
    }

    // Generate AIDA content with a more structured prompt
    console.log("Generating AIDA content...");
    const aidaPrompt = {
      business: businessIdea,
      audience: targetAudience,
      analysis: audienceAnalysis,
      sections: ["howItWorks", "marketAnalysis", "objections", "FAQ"]
    };

    let aidaContent;
    try {
      const completion = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are a landing page content expert. Return a valid JSON object containing sections for howItWorks, marketAnalysis (with solution, features, and socialProof), objections, and FAQ.`
          },
          {
            role: "user",
            content: JSON.stringify(aidaPrompt)
          }
        ],
        temperature: 0.7
      });

      console.log("Raw AIDA response:", completion.choices[0].message.content);
      aidaContent = JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error("AIDA content generation error:", error);
      throw new Error(`AIDA content generation failed: ${error.message}`);
    }

    // Handle hero image
    let heroImage = projectImages[0];
    if (!heroImage) {
      console.log("Generating hero image...");
      const replicate = new Replicate({
        auth: Deno.env.get('REPLICATE_API_KEY'),
      });

      if (!replicate.auth) {
        throw new Error('REPLICATE_API_KEY is not configured');
      }

      const imagePrompt = `Professional photograph for a landing page promoting: ${businessIdea.description || businessIdea.name}. High resolution, commercial quality.`;
      console.log("Image generation prompt:", imagePrompt);

      const output = await replicate.run(
        "black-forest-labs/flux-1.1-pro",
        {
          input: {
            prompt: imagePrompt,
            width: 1024,
            height: 1024,
            num_outputs: 1,
            go_fast: true,
            megapixels: "1",
            aspect_ratio: "1:1",
            output_format: "webp",
            output_quality: 80,
            num_inference_steps: 4
          }
        }
      );

      heroImage = Array.isArray(output) ? output[0] : output;
      console.log("Hero image generated:", heroImage);
    }

    // Map content to template
    const generatedContent = mapToTemplateStructure(aidaContent, heroContent, heroImage);
    console.log("Content mapping complete");

    return new Response(
      JSON.stringify(generatedContent),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      },
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
      },
    );
  }
});
