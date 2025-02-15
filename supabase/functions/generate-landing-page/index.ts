
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

    // Initialize OpenAI client
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: Deno.env.get('DEEPSEEK_API_KEY')
    });

    if (!openai.apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate hero content
    console.log("Generating hero content...");
    const heroPrompt = `Write a compelling headline and subtitle for a landing page that promotes ${businessIdea.description || businessIdea.name} following the AIDA formula. Return as JSON with headline and subtitle sections.`;
    console.log("Hero prompt:", heroPrompt);

    const heroCompletion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are an expert copywriter specializing in landing page headlines. Create compelling content following the AIDA formula. Return only valid JSON."
        },
        {
          role: "user",
          content: heroPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    console.log("Hero content generated");
    const heroContent = parseOpenAIResponse(heroCompletion.choices[0].message.content);

    // Generate AIDA content
    console.log("Generating AIDA content...");
    const aidaPrompt = `Generate landing page content for: ${JSON.stringify({
      business: businessIdea,
      audience: targetAudience,
      analysis: audienceAnalysis
    })}. Include howItWorks, marketAnalysis, objections, and FAQ sections.`;
    console.log("AIDA prompt:", aidaPrompt);

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are a landing page content expert. Generate comprehensive content following the AIDA framework. Return only valid JSON."
        },
        {
          role: "user",
          content: aidaPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    console.log("AIDA content generated");
    const aidaContent = parseOpenAIResponse(completion.choices[0].message.content);

    // Handle hero image
    let heroImage = projectImages[0];
    if (!heroImage) {
      console.log("Generating hero image...");
      const replicate = new Replicate({
        auth: Deno.env.get('REPLICATE_API_KEY'),
      });

      if (!replicate.auth) {
        return new Response(
          JSON.stringify({ error: 'Replicate API key is not configured' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const imagePrompt = `Professional DSLR photograph for a landing page promoting: ${businessIdea.description || businessIdea.name}. 8k resolution, commercial quality.`;
      console.log("Image generation prompt:", imagePrompt);

      const output = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            prompt: imagePrompt,
            width: 1024,
            height: 1024,
            num_outputs: 1,
            guidance_scale: 7.5,
            negative_prompt: "cartoon, illustration, painting, drawing, art, digital art, anime, manga, low quality, blurry"
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
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
