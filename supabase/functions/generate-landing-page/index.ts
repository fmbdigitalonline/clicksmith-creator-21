
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
    const contentPrompt = `Create a landing page content for ${businessIdea.description || businessIdea.name} that promotes: ${JSON.stringify(businessIdea)}. 
    
Target Audience Information:
${JSON.stringify(targetAudience)}

Audience Analysis:
${JSON.stringify(audienceAnalysis)}

Follow the AIDA framework to generate a complete landing page with these sections:

1. How It Works:
- Create 4 clear steps that explain the process
- Each step should have a title and detailed description
- Include value reinforcement after steps

2. Market Analysis:
- Analyze the current market situation
- Identify key pain points and solutions
- List 3-4 unique features with benefits

3. Value Proposition:
- Create 3 compelling cards with icons
- Each card should highlight a key benefit
- Focus on solving main pain points

4. Features:
- List 4-5 key features
- Each feature should have a title and detailed description
- Focus on technical capabilities and benefits

5. Testimonials:
- Create 2-3 realistic testimonials
- Include specific results and benefits
- Vary the types of users/roles

6. Objections:
- Address 3-4 common concerns
- Provide clear, convincing answers
- Build trust through responses

7. FAQ:
- Create 4-5 relevant questions and answers
- Cover technical and practical aspects
- Address common user concerns

Return a JSON object with these sections structured appropriately.`;

    console.log("Generating content with prompt:", contentPrompt);

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are an expert landing page copywriter. Create compelling content following the AIDA framework. Return only valid JSON with properly populated arrays and objects for each section."
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
    console.log("Generated AIDA content:", aidaContent);

    // Generate hero section separately for better attention-grabbing content
    const heroPrompt = `Create a compelling hero section for this business:
Product/Service: ${businessIdea.description}
Target Audience: ${JSON.stringify(targetAudience)}
Value Proposition: ${businessIdea.valueProposition}
Pain Points: ${JSON.stringify(audienceAnalysis?.deepPainPoints || [])}

Create an attention-grabbing hero section that:
1. Has a powerful headline (8-12 words) that addresses the main pain point
2. Includes an emotional subtitle that shows the transformation
3. Highlights the key benefit that sets this solution apart
4. Has a compelling call-to-action

Focus on the transformation from pain point to solution.`;

    const heroCompletion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are an expert copywriter specializing in attention-grabbing headlines. Return only valid JSON with headline and subtitle text."
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
    console.log("Generated hero content:", heroContent);

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
        title: heroContent.headline || "Transform Your Business Idea into Reality",
        description: heroContent.subtitle || "Get the professional business plan you need to secure funding and launch your startup successfully.",
        cta: "Get Started Now",
        image: heroImage
      },
      howItWorks: {
        subheadline: "How It Works",
        steps: aidaContent.howItWorks?.steps || [
          {
            title: "Share Your Vision",
            description: "Tell us about your business idea and goals"
          },
          {
            title: "AI-Powered Analysis",
            description: "Our system analyzes your input and market data"
          },
          {
            title: "Generate Your Plan",
            description: "Receive a comprehensive business plan"
          },
          {
            title: "Ready for Funding",
            description: "Present your professional plan to investors"
          }
        ],
        valueReinforcement: aidaContent.howItWorks?.valueReinforcement || "Transform your idea into a fundable business plan in minutes"
      },
      marketAnalysis: {
        context: aidaContent.marketAnalysis?.context || "The business planning landscape is evolving",
        solution: aidaContent.marketAnalysis?.solution || "Our platform bridges the gap between ideas and funding",
        painPoints: aidaContent.marketAnalysis?.painPoints || audienceAnalysis?.deepPainPoints?.map((point: string) => ({
          title: point,
          description: `We help solve ${point} through our innovative approach`
        })) || [],
        features: aidaContent.marketAnalysis?.features || []
      },
      valueProposition: {
        title: "Why Choose Us?",
        cards: aidaContent.valueProposition?.cards || [
          {
            icon: "✨",
            title: "Professional Quality",
            description: "Bank-ready business plans that get results"
          },
          {
            icon: "🎯",
            title: "Time-Saving",
            description: "Complete your plan in minutes, not weeks"
          },
          {
            icon: "💫",
            title: "Funding-Focused",
            description: "Designed to help you secure investments"
          }
        ]
      },
      features: {
        title: "Key Features",
        description: aidaContent.features?.description || "Everything you need to create a professional business plan",
        items: aidaContent.features?.items || [
          {
            title: "AI-Powered Analysis",
            description: "Advanced algorithms analyze your business potential"
          },
          {
            title: "Financial Projections",
            description: "Accurate financial forecasts and metrics"
          },
          {
            title: "Market Research",
            description: "Comprehensive industry and competitor analysis"
          }
        ]
      },
      testimonials: {
        title: "What Our Clients Say",
        items: aidaContent.testimonials?.items || [
          {
            quote: "This platform helped me secure my startup funding in record time.",
            author: "Sarah Johnson",
            role: "Tech Entrepreneur"
          },
          {
            quote: "The quality of the business plan exceeded my expectations.",
            author: "Michael Chen",
            role: "Small Business Owner"
          }
        ]
      },
      objections: {
        subheadline: "Common Questions Answered",
        concerns: aidaContent.objections?.concerns || audienceAnalysis?.potentialObjections?.map((objection: string) => ({
          question: objection,
          answer: `We understand your concern about ${objection.toLowerCase()}. Our platform is specifically designed to address this by providing professional, customizable solutions.`
        })) || []
      },
      faq: {
        subheadline: "Frequently Asked Questions",
        questions: aidaContent.faq?.questions || [
          {
            question: "How long does it take to create a business plan?",
            answer: "Most users complete their business plan within 30 minutes."
          },
          {
            question: "Is the plan customizable?",
            answer: "Yes, you can customize every aspect of your business plan."
          },
          {
            question: "What makes your platform different?",
            answer: "Our AI-powered platform combines speed with professional quality."
          }
        ]
      },
      cta: {
        title: "Ready to Transform Your Business Idea?",
        description: "Join thousands of successful entrepreneurs who've secured funding with our platform.",
        buttonText: "Start Your Business Plan Now"
      },
      footerContent: {
        contact: "Contact us for support",
        newsletter: "Subscribe to our newsletter for business planning tips",
        copyright: `© ${new Date().getFullYear()} All rights reserved.`
      }
    };

    console.log("Final generated content:", generatedContent);

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
