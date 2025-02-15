
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
    const { businessIdea, targetAudience, audienceAnalysis, marketingCampaign, projectImages = [] } = await req.json();

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
      audienceAnalysis,
      marketingCampaign
    });

    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: Deno.env.get('DEEPSEEK_API_KEY')
    });

    // Generate main content following AIDA framework
    const contentPrompt = `Create a landing page content for ${businessIdea.description || businessIdea.name} following this structure:

Business Context:
${JSON.stringify({ businessIdea, targetAudience, audienceAnalysis, marketingCampaign }, null, 2)}

Generate content following the AIDA framework (Attention, Interest, Desire, Action) with these sections:

1. Hero Section (Attention):
- Compelling headline addressing pain points
- Emotional subtitle highlighting benefits
- Clear value proposition
- Strong call-to-action

2. How It Works Section (Interest):
- Clear step-by-step process
- Value reinforcement
- Technical highlights
- Benefits at each step

3. Market Analysis (Interest/Desire):
- Industry context
- Current market situation
- Solution positioning
- Key benefits

4. Value Proposition:
- Main benefits
- Unique selling points
- Competitive advantages

5. Features Section:
- Key features
- Technical capabilities
- Integration possibilities
- User benefits

6. Testimonials:
- Customer success stories
- Result metrics
- User experiences

7. Objections Section:
- Common concerns
- Clear answers
- Trust building elements

8. FAQ Section:
- Frequent questions
- Detailed answers
- Technical clarifications

9. Final CTA:
- Urgency elements
- Clear next steps
- Value reinforcement

10. Footer:
- Contact information
- Newsletter signup
- Copyright information

Return a JSON object with these exact sections structured appropriately.`;

    console.log("Generating content with prompt:", contentPrompt);

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are an expert landing page copywriter. Create compelling content following the AIDA framework. Return only valid JSON."
        },
        {
          role: "user",
          content: contentPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const aidaContent = JSON.parse(completion.choices[0].message.content);

    // Generate hero section separately for better attention-grabbing content
    const heroPrompt = `Create a compelling hero section for this landing page:

Business: ${businessIdea.description}
Target Audience: ${JSON.stringify(targetAudience)}
Value Proposition: ${businessIdea.valueProposition}

Create an attention-grabbing hero section that:
1. Has a powerful headline (8-12 words)
2. Includes an emotional subtitle
3. Addresses key pain points
4. Highlights primary benefits
5. Has a compelling call-to-action

Return as JSON with these fields:
{
  "headline": "string",
  "subtitle": {
    "interest": "string",
    "desire": "string",
    "action": "string"
  }
}`;

    const heroCompletion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are an expert copywriter specializing in attention-grabbing headlines. Return only valid JSON."
        },
        {
          role: "user",
          content: heroPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const heroContent = JSON.parse(heroCompletion.choices[0].message.content);

    // Handle hero image
    let heroImage = projectImages[0];
    if (!heroImage) {
      console.log("Generating hero image...");
      const replicate = new Replicate({
        auth: Deno.env.get('REPLICATE_API_KEY'),
      });

      const imagePrompt = `Professional photograph for a landing page promoting: ${businessIdea.description}. High resolution, commercial quality.`;
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
    }

    // Combine all content
    const generatedContent = {
      hero: {
        title: heroContent.headline,
        description: [
          heroContent.subtitle.interest,
          heroContent.subtitle.desire,
          heroContent.subtitle.action
        ].filter(Boolean).join(' '),
        cta: "Get Started Now",
        image: heroImage
      },
      howItWorks: {
        subheadline: "How it works",
        steps: aidaContent.howItWorks?.steps || [],
        valueReinforcement: aidaContent.howItWorks?.valueReinforcement || ""
      },
      marketAnalysis: {
        context: aidaContent.marketAnalysis?.context || "",
        solution: aidaContent.marketAnalysis?.solution || "",
        painPoints: aidaContent.marketAnalysis?.painPoints || [],
        features: aidaContent.marketAnalysis?.features || [],
        socialProof: aidaContent.marketAnalysis?.socialProof || {}
      },
      valueProposition: {
        title: "Why Choose Us?",
        cards: (aidaContent.marketAnalysis?.painPoints || []).map((point: any, index: number) => ({
          icon: ["✨", "🎯", "💫"][index % 3],
          title: point.title,
          description: point.description
        }))
      },
      features: {
        title: "Key Features",
        description: aidaContent.marketAnalysis?.solution || "",
        items: aidaContent.marketAnalysis?.features || []
      },
      testimonials: {
        title: "What Our Clients Say",
        items: [aidaContent.marketAnalysis?.socialProof || {
          quote: "This solution has transformed how we operate. Highly recommended!",
          author: "John Smith",
          role: "Business Owner"
        }]
      },
      objections: aidaContent.objections || {
        subheadline: "Common Concerns Addressed",
        concerns: []
      },
      faq: aidaContent.faq || {
        subheadline: "Frequently Asked Questions",
        questions: []
      },
      cta: {
        title: "Ready to Get Started?",
        description: aidaContent.howItWorks?.valueReinforcement || "Join us today and experience the difference.",
        buttonText: "Get Started Now"
      },
      footerContent: aidaContent.footerContent || {
        contact: "Contact us for support",
        newsletter: "Subscribe to our newsletter",
        copyright: `© ${new Date().getFullYear()} All rights reserved.`
      },
      layout: {
        style: "modern",
        colorScheme: "light"
      }
    };

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
