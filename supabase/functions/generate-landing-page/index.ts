
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

    // Initialize Replicate client
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY is not set');
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase environment variables');
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating landing page content for project:', projectId);

    // Generate hero image prompt
    const heroImagePrompt = `Professional website hero image showcasing:
    A modern professional using digital tools for market research and business validation.
    Style: Clean, modern, bright workspace environment with data visualizations and social media elements.
    High quality, suitable for website hero section with text overlay.
    No text, no watermarks, no logos.`;

    console.log('Generating hero image with prompt:', heroImagePrompt);
    const imageOutput = await replicate.run(
      "black-forest-labs/flux-1.1-pro-ultra",
      {
        input: {
          prompt: heroImagePrompt,
          negative_prompt: "blur, watermark, text, logo, signature, low quality",
          num_inference_steps: 50,
          guidance_scale: 7.5,
          width: 1024,
          height: 576,
          style_preset: "photographic",
          num_outputs: 1
        }
      }
    );

    console.log('Image generation response:', imageOutput);
    const heroImageUrl = Array.isArray(imageOutput) ? imageOutput[0] : imageOutput;

    if (!heroImageUrl) {
      throw new Error('Failed to generate hero image');
    }

    // Generate complete landing page content with all sections
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
                highlights: ["Instant Feedback", "Real Market Data"]
              },
              {
                title: "AI-Powered Analysis",
                description: "Understand your target audience with deep market insights and behavior analysis",
                highlights: ["Audience Insights", "Behavior Patterns"]
              },
              {
                title: "Social Media Integration",
                description: "Create and test social media ads to find what resonates with your audience",
                highlights: ["Multi-Platform", "Performance Tracking"]
              }
            ]
          }
        },
        {
          type: 'dynamic',
          order: 3,
          layout: {
            style: 'columns',
            background: 'light'
          },
          content: {
            title: "Your Path to Market Success",
            subtitle: "Four simple steps to validate your business idea",
            mainDescription: "Stop guessing what your market wants. Use our proven process to test, learn, and adapt your business ideas with real market feedback.",
            bulletPoints: [
              "Input your business idea or service concept",
              "Get AI-powered market analysis and audience insights",
              "Test your messaging with real social media ads",
              "Receive detailed feedback and actionable recommendations"
            ]
          }
        },
        {
          type: 'dynamic',
          order: 4,
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

    // Generate a title based on business idea
    const landingPageTitle = "Market Testing & Validation Platform";

    // Store the landing page content
    const { data: landingPage, error: upsertError } = await supabase
      .from('landing_pages')
      .upsert({
        project_id: projectId,
        user_id: userId,
        content: landingPageContent,
        title: landingPageTitle,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (upsertError) throw upsertError;

    console.log('Landing page content generated and stored successfully');

    return new Response(JSON.stringify({ content: landingPageContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating landing page:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
