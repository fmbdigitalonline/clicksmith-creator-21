
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BusinessIdeaInput {
  description: string;
  valueProposition: string;
}

interface TargetAudienceInput {
  description: string;
  painPoints: string[];
  demographics?: string;
  coreMessage?: string;
  marketingAngle?: string;
}

interface RequestBody {
  projectId: string;
  businessName: string;
  businessIdea: BusinessIdeaInput;
  targetAudience: TargetAudienceInput;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { businessName, businessIdea, targetAudience } = await req.json() as RequestBody;

    // Generate the hero section content using the business idea and target audience
    const heroPrompt = `
      Create a compelling hero section for ${businessName} that includes:
      1. A headline that captures attention and communicates the main value proposition
      2. A subheadline that expands on the key benefits
      3. A call to action button text
      
      Business description: ${businessIdea.description}
      Value proposition: ${businessIdea.valueProposition}
      Target audience: ${targetAudience.description}
      Core message: ${targetAudience.coreMessage || ''}

      Format the response as JSON with fields: headline, subheadline, cta
    `;

    // Generate the landing page content following AIDA framework
    const contentPrompt = `
      Create a complete landing page content for ${businessName} following the AIDA framework:
      
      Context:
      - Business: ${businessIdea.description}
      - Value proposition: ${businessIdea.valueProposition}
      - Target audience: ${targetAudience.description}
      - Pain points: ${targetAudience.painPoints.join(', ')}
      - Demographics: ${targetAudience.demographics || 'Not specified'}
      - Marketing angle: ${targetAudience.marketingAngle || 'Not specified'}
      
      Requirements:
      1. Follow AIDA framework (Attention, Interest, Desire, Action)
      2. Use modern, professional tone aligned with ${businessName}'s brand
      3. Include specific sections:
         - Value proposition (3 key benefits)
         - Features/How it works (3-4 main features)
         - Social proof/testimonials (2-3 examples)
         - Pricing (if applicable)
         - FAQ (3-4 common questions)
      4. Each section should have a heading and subheading
      
      Format the response as JSON with sections: valueProposition, features, testimonials, pricing, faq
      Use consistent styling matching a modern SaaS theme.
    `;

    // Call DeepSeek API for hero content
    const heroResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("DEEPSEEK_API_KEY")}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a professional copywriter specializing in landing pages." },
          { role: "user", content: heroPrompt }
        ]
      })
    });

    // Call DeepSeek API for main content
    const contentResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("DEEPSEEK_API_KEY")}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a professional copywriter specializing in landing pages." },
          { role: "user", content: contentPrompt }
        ]
      })
    });

    const heroData = await heroResponse.json();
    const contentData = await contentResponse.json();

    // Generate hero image using Flux Pro
    const imagePrompt = `
      Create a modern, professional hero image for ${businessName}.
      Context: ${businessIdea.valueProposition}
      Style: Modern, clean, professional
      Color scheme: Deep purple and soft white gradients
    `;

    const imageResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${Deno.env.get("REPLICATE_API_TOKEN")}`
      },
      body: JSON.stringify({
        version: "black-forest-labs/FLUX.1-schnell",
        input: {
          prompt: imagePrompt,
          negative_prompt: "text, watermark, low quality, blurry",
          num_inference_steps: 50,
          guidance_scale: 7.5
        }
      })
    });

    const imageData = await imageResponse.json();

    // Combine all generated content
    const landingPageContent = {
      hero: {
        ...JSON.parse(heroData.choices[0].message.content),
        image: imageData.output
      },
      ...JSON.parse(contentData.choices[0].message.content)
    };

    return new Response(
      JSON.stringify(landingPageContent),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating landing page:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
