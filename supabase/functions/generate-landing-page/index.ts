
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.20.1";
import Replicate from "https://esm.sh/replicate@0.25.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Ensure we get valid string values from any data
const ensureString = (value: any): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
};

// Ensure array items are properly formatted
const ensureArrayItems = <T>(items: any[] | undefined, defaultValue: T[]): T[] => {
  if (!Array.isArray(items)) return defaultValue;
  return items;
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
      return {
        error: "Failed to parse AI response",
        content: content
      };
    }
  }
};

// Map AIDA content to template structure with dynamic layout and proper type conversion
const mapToTemplateStructure = (aidaContent: any, heroContent: any, heroImage: string) => {
  console.log("Mapping content to template structure");
  
  if (!aidaContent || !heroContent) {
    console.error("Missing required content:", { aidaContent, heroContent });
    throw new Error("Missing required content for template structure");
  }

  // Ensure proper typing for pain points
  const painPoints = ensureArrayItems(aidaContent.marketAnalysis?.painPoints, [])
    .map((point: any) => ({
      title: ensureString(point.title),
      description: ensureString(point.description)
    }));

  // Ensure proper typing for features
  const features = ensureArrayItems(aidaContent.marketAnalysis?.features, [])
    .map((feature: any) => ({
      title: ensureString(feature.title),
      description: ensureString(feature.description)
    }));

  return {
    hero: {
      title: ensureString(heroContent.headline),
      description: ensureString([
        heroContent.subtitle?.interest,
        heroContent.subtitle?.desire,
        heroContent.subtitle?.action
      ].filter(Boolean).join(' ')),
      cta: ensureString(heroContent.subtitle?.action || "Get Started"),
      image: ensureString(heroImage),
    },
    valueProposition: {
      title: "Why Choose Us?",
      cards: painPoints.map((point, index) => ({
        icon: ["✨", "🎯", "💫"][index % 3],
        title: ensureString(point.title),
        description: ensureString(point.description)
      }))
    },
    features: {
      title: "Key Features",
      description: ensureString(aidaContent.marketAnalysis?.solution),
      items: features.map(feature => ({
        title: ensureString(feature.title),
        description: ensureString(feature.description)
      }))
    },
    howItWorks: {
      subheadline: "How it works",
      steps: ensureArrayItems(aidaContent.howItWorks?.steps, []).map((step: any) => ({
        title: ensureString(step.title),
        description: ensureString(step.description)
      })),
      valueReinforcement: ensureString(aidaContent.howItWorks?.valueReinforcement)
    },
    testimonials: {
      title: "What Our Clients Say",
      items: [{
        quote: ensureString(aidaContent.marketAnalysis?.socialProof?.quote),
        author: ensureString(aidaContent.marketAnalysis?.socialProof?.author),
        role: ensureString(aidaContent.marketAnalysis?.socialProof?.title)
      }]
    },
    marketAnalysis: {
      context: ensureString(aidaContent.marketAnalysis?.context),
      solution: ensureString(aidaContent.marketAnalysis?.solution),
      painPoints: painPoints,
      features: features,
      socialProof: {
        quote: ensureString(aidaContent.marketAnalysis?.socialProof?.quote),
        author: ensureString(aidaContent.marketAnalysis?.socialProof?.author),
        title: ensureString(aidaContent.marketAnalysis?.socialProof?.title)
      }
    },
    objections: {
      subheadline: ensureString(aidaContent.objections?.subheadline),
      concerns: ensureArrayItems(aidaContent.objections?.concerns, []).map((concern: any) => ({
        question: ensureString(concern.question),
        answer: ensureString(concern.answer)
      }))
    },
    faq: {
      subheadline: ensureString(aidaContent.faq?.subheadline),
      questions: ensureArrayItems(aidaContent.faq?.questions, []).map((q: any) => ({
        question: ensureString(q.question),
        answer: ensureString(q.answer)
      }))
    },
    cta: {
      title: "Ready to Get Started?",
      description: ensureString(aidaContent.howItWorks?.valueReinforcement || "Join us today!"),
      buttonText: "Get Started Now"
    },
    footerContent: {
      contact: ensureString(aidaContent.footerContent?.contact),
      newsletter: ensureString(aidaContent.footerContent?.newsletter),
      copyright: ensureString(aidaContent.footerContent?.copyright)
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
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
