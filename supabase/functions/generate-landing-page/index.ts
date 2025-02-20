import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, businessIdea, targetAudience, userId } = await req.json();
    console.log('Starting landing page generation for project:', projectId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase environment variables');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check user credits before proceeding
    const { data: creditCheck, error: creditCheckError } = await supabase.rpc(
      'check_user_credits',
      { p_user_id: userId, required_credits: 1 }
    );

    if (creditCheckError) {
      console.error('Credit check failed:', creditCheckError);
      throw new Error(`Credit check failed: ${creditCheckError.message}`);
    }

    if (!creditCheck[0].has_credits) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits', 
          message: creditCheck[0].error_message 
        }),
        {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate hero image with more engaging, people-focused prompt
    const heroImagePrompt = `Professional website hero image showcasing:
    Diverse team of happy professionals collaborating in a modern workspace.
    Natural, authentic interactions with positive body language.
    Bright, well-lit environment with modern office elements.
    High quality photographic style, perfect for website hero section.
    No text, no watermarks, no logos.`;

    console.log('Generating hero image with prompt:', heroImagePrompt);
    const heroImageOutput = await replicate.run(
      "black-forest-labs/flux-1.1-pro-ultra",
      {
        input: {
          prompt: heroImagePrompt,
          negative_prompt: "blur, watermark, text, logo, signature, low quality, artificial poses, fake smiles",
          num_inference_steps: 50,
          guidance_scale: 7.5,
          width: 1024,
          height: 576,
          style_preset: "photographic",
          num_outputs: 1
        }
      }
    );

    // Generate analysis section image focused on people
    const analysisImagePrompt = `Professional business scene showing:
    Diverse group of happy business professionals analyzing market data together.
    Modern office setting with natural lighting.
    People pointing at and discussing digital charts on screens.
    Collaborative and positive atmosphere with genuine smiles.
    Natural, candid interaction showing engagement and success.
    High quality photographic style, no text or watermarks.`;

    console.log('Generating analysis image with prompt:', analysisImagePrompt);
    const analysisImageOutput = await replicate.run(
      "black-forest-labs/flux-1.1-pro-ultra",
      {
        input: {
          prompt: analysisImagePrompt,
          negative_prompt: "blur, watermark, text, logo, signature, low quality, artificial poses, fake smiles, charts without people",
          num_inference_steps: 50,
          guidance_scale: 7.5,
          width: 800,
          height: 600,
          style_preset: "photographic",
          num_outputs: 1
        }
      }
    );

    // Generate workflow image focused on people
    const workflowImagePrompt = `Professional business consulting scene:
    Happy entrepreneur and consultant reviewing business results together.
    Modern, bright office environment with natural lighting.
    Positive body language and genuine smiles showing success.
    Natural, candid interaction demonstrating collaboration.
    Diverse professionals in business attire.
    High quality photographic style, no text or watermarks.`;

    console.log('Generating workflow image with prompt:', workflowImagePrompt);
    const workflowImageOutput = await replicate.run(
      "black-forest-labs/flux-1.1-pro-ultra",
      {
        input: {
          prompt: workflowImagePrompt,
          negative_prompt: "blur, watermark, text, logo, signature, low quality, artificial poses, fake smiles, diagrams without people",
          num_inference_steps: 50,
          guidance_scale: 7.5,
          width: 800,
          height: 600,
          style_preset: "photographic",
          num_outputs: 1
        }
      }
    );

    const heroImageUrl = Array.isArray(heroImageOutput) ? heroImageOutput[0] : heroImageOutput;
    const analysisImageUrl = Array.isArray(analysisImageOutput) ? analysisImageOutput[0] : analysisImageOutput;
    const workflowImageUrl = Array.isArray(workflowImageOutput) ? workflowImageOutput[0] : workflowImageOutput;

    if (!heroImageUrl || !analysisImageUrl || !workflowImageUrl) {
      throw new Error('Failed to generate one or more images');
    }

    // Generate complete landing page content with expanded sections
    const landingPageContent = {
      sections: [
        {
          type: 'hero',
          order: 0,
          content: {
            title: "Validate Your Business Ideas with Real Market Data",
            subtitle: "Transform your products, services, and marketing campaigns into validated successes through quick market testing and real audience feedback.",
            imageUrl: heroImageUrl,
            primaryCta: {
              text: "Start Testing Your Idea",
              description: "Get market insights in minutes"
            },
            secondaryCta: {
              text: "See How It Works",
              description: "Learn about our testing process"
            }
          }
        },
        {
          type: 'social-proof',
          order: 1,
          content: {
            title: "Trusted by Forward-Thinking Entrepreneurs",
            items: [
              {
                title: "83%",
                description: "Faster Market Validation"
              },
              {
                title: "2.5x",
                description: "Better Client Targeting"
              },
              {
                title: "95%",
                description: "User Satisfaction"
              }
            ]
          }
        },
        {
          type: 'features',
          order: 2,
          layout: {
            style: 'grid',
            background: 'gradient'
          },
          content: {
            title: "Market Testing Made Simple",
            subtitle: "Get the insights you need to make confident business decisions",
            items: [
              {
                title: "Quick Market Testing",
                description: "Test your business ideas, products, or services in minutes instead of months",
                highlights: ["Instant Feedback", "Real Market Data", "AI-Powered Analysis"]
              },
              {
                title: "AI-Powered Analysis",
                description: "Understand your target audience with deep market insights and behavior analysis",
                highlights: ["Audience Insights", "Behavior Patterns", "Predictive Analytics"]
              },
              {
                title: "Social Media Integration",
                description: "Create and test social media ads to find what resonates with your audience",
                highlights: ["Multi-Platform", "Performance Tracking", "A/B Testing"]
              }
            ]
          }
        },
        {
          type: 'dynamic',
          order: 3,
          layout: {
            style: 'split',
            background: 'light'
          },
          content: {
            title: "Comprehensive Market Analysis",
            subtitle: "Get Deep Insights Into Your Market",
            mainDescription: "Our AI-powered platform analyzes multiple data sources to give you a complete picture of your market opportunity.",
            bulletPoints: [
              "Detailed competitor analysis and market positioning",
              "Customer sentiment analysis across social platforms",
              "Trend identification and growth opportunity spotting",
              "Real-time market demand assessment"
            ],
            imageUrl: analysisImageUrl
          }
        },
        {
          type: 'features',
          order: 4,
          layout: {
            style: 'columns',
            background: 'white'
          },
          content: {
            title: "Advanced Features for Deep Insights",
            subtitle: "Everything you need to validate and launch successfully",
            items: [
              {
                title: "Real-Time Testing",
                description: "Launch quick market tests and get results within hours",
                details: ["Instant feedback loops", "Real user responses", "Quick iterations"]
              },
              {
                title: "Audience Analysis",
                description: "Understand exactly who your customers are and what they want",
                details: ["Demographic insights", "Behavior patterns", "Purchase intent"]
              },
              {
                title: "Competition Tracking",
                description: "Stay ahead of market trends and competitor movements",
                details: ["Market positioning", "Competitor strategies", "Gap analysis"]
              }
            ]
          }
        },
        {
          type: 'dynamic',
          order: 5,
          layout: {
            style: 'columns',
            background: 'gradient'
          },
          content: {
            title: "How It Works",
            subtitle: "Your Journey to Market Success",
            mainDescription: "Our proven four-step process helps you validate your ideas and launch with confidence.",
            bulletPoints: [
              "1. Input your business concept and target market",
              "2. Receive AI-generated market analysis and insights",
              "3. Test your messaging with real audience feedback",
              "4. Get actionable recommendations for success"
            ],
            imageUrl: workflowImageUrl
          }
        },
        {
          type: 'dynamic',
          order: 6,
          layout: {
            width: 'contained',
            spacing: 'spacious'
          },
          content: {
            title: "Common Questions About Market Testing",
            subtitle: "Get answers to frequently asked questions",
            items: [
              {
                title: "How long does market testing take?",
                description: "Most tests can be completed within 24-48 hours, giving you quick insights to make informed decisions."
              },
              {
                title: "What kind of results can I expect?",
                description: "You'll receive detailed audience insights, market demand metrics, and actionable recommendations."
              },
              {
                title: "Is this suitable for my industry?",
                description: "Our platform works across all industries, from tech to retail, services to products."
              }
            ]
          }
        },
        {
          type: 'features',
          order: 7,
          layout: {
            style: 'grid',
            background: 'light'
          },
          content: {
            title: "Success Stories",
            subtitle: "See how others have validated their ideas",
            items: [
              {
                title: "Tech Startup",
                description: "Validated product-market fit in 2 weeks instead of 6 months",
                highlights: ["90% time saved", "50K in saved development costs"]
              },
              {
                title: "Service Business",
                description: "Found perfect target audience and messaging in first attempt",
                highlights: ["3x conversion rate", "Perfect market fit"]
              },
              {
                title: "E-commerce Brand",
                description: "Identified winning products before launch",
                highlights: ["Zero inventory waste", "145% ROI"]
              }
            ]
          }
        },
        {
          type: 'dynamic',
          order: 8,
          layout: {
            width: 'contained',
            spacing: 'spacious',
            style: 'center'
          },
          content: {
            title: "Ready to Validate Your Idea?",
            subtitle: "Join successful entrepreneurs who've already transformed their businesses with market insights",
            primaryCta: {
              text: "Start Your Market Test",
              description: "Begin with a free trial"
            },
            secondaryCta: {
              text: "Schedule a Demo",
              description: "See how it works live"
            }
          }
        }
      ]
    };

    // Store the landing page content and get the complete landing page object
    const { data: landingPage, error: upsertError } = await supabase
      .from('landing_pages')
      .upsert({
        project_id: projectId,
        user_id: userId,
        content: landingPageContent,
        title: "Market Testing & Validation Platform",
        updated_at: new Date().toISOString(),
        content_iterations: 1
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error storing landing page:', upsertError);
      throw upsertError;
    }

    // Deduct 1 credit after successful generation
    const { data: deductionResult, error: deductionError } = await supabase.rpc(
      'deduct_user_credits',
      { input_user_id: userId, credits_to_deduct: 1 }
    );

    if (deductionError) {
      console.error('Error deducting credits:', deductionError);
    }

    if (!deductionResult?.[0]?.success) {
      console.error('Failed to deduct credits:', deductionResult?.[0]?.error_message);
    }

    console.log('Landing page generated successfully for project:', projectId);

    // Return the complete landing page object
    return new Response(
      JSON.stringify({ 
        content: landingPageContent,
        project_id: landingPage.project_id,
        id: landingPage.id,
        content_iterations: landingPage.content_iterations
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating landing page:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
