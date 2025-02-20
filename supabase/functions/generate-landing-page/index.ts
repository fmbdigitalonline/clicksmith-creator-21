
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
    const heroImagePrompt = `Professional website hero image for:
    ${businessIdea?.description || 'A modern business'}. 
    Target audience: ${targetAudience?.description || 'professionals'}.
    Style: Clean, modern, corporate, professional photography style.
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

    // Generate content based on business idea and target audience
    const businessName = businessIdea?.name || "Our Business";
    const targetDescription = targetAudience?.description || "our customers";
    const businessDescription = businessIdea?.description || "our products and services";

    // Generate complete landing page content with all sections
    const landingPageContent = {
      sections: [
        {
          type: 'hero',
          order: 0,
          content: {
            title: `${businessName}: ${businessIdea?.value_proposition || 'Innovative Solutions for Your Needs'}`,
            subtitle: `${businessDescription} - Designed for ${targetDescription}`,
            imageUrl: heroImageUrl,
            primaryCta: {
              text: "Get Started Now",
              description: "Begin your journey with us"
            },
            secondaryCta: {
              text: "Learn More",
              description: "Discover how we can help"
            }
          }
        },
        {
          type: 'social-proof',
          order: 1,
          content: {
            title: "Why People Trust Us",
            items: [
              {
                title: "5★ Rating",
                description: "Customer Satisfaction"
              },
              {
                title: "100%",
                description: "Quality Guaranteed"
              },
              {
                title: "24/7",
                description: "Customer Support"
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
            title: "Why Choose " + businessName,
            subtitle: "Discover the features that make us unique",
            items: [
              {
                title: "Premium Quality",
                description: "We use only the finest materials and processes",
                highlights: ["Quality Guaranteed", "Premium Materials"]
              },
              {
                title: "Customer-Focused",
                description: `Designed specifically for ${targetDescription}`,
                highlights: ["Personalized Service", "Customer Support"]
              },
              {
                title: "Innovative Solution",
                description: businessIdea?.value_proposition || "Leading-edge solutions",
                highlights: ["Innovation", "Excellence"]
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
            title: "How It Works",
            subtitle: "Simple steps to get started",
            mainDescription: `Experience the difference with ${businessName}. We make it easy to get started and ensure your complete satisfaction.`,
            bulletPoints: [
              "Browse our selection and choose what works for you",
              "Place your order with our secure checkout",
              "Receive your items and enjoy the quality"
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
            title: "Ready to Get Started?",
            subtitle: "Join our satisfied customers today",
            primaryCta: {
              text: "Start Now",
              description: "Begin your journey"
            },
            secondaryCta: {
              text: "Contact Us",
              description: "Have questions? We're here to help"
            }
          }
        }
      ]
    };

    // Generate a title based on business idea or use default
    const landingPageTitle = businessIdea?.name 
      ? `${businessIdea.name} - Landing Page`
      : "My Business Landing Page";

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
