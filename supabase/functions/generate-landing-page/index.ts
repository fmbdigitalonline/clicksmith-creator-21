
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, businessName, businessIdea, targetAudience } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create a log entry
    const { data: log } = await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        status: 'started',
        step_details: { stage: 'started' },
        success: false
      })
      .select()
      .single();

    if (!log) throw new Error('Failed to create generation log');

    // Generate the content structure
    const content = {
      hero: {
        title: `${businessName} - Innovation Meets Excellence`,
        description: `Transform your experience with our cutting-edge solutions. ${businessIdea}`,
        cta: "Get Started Today",
      },
      features: {
        title: "Why Choose Us",
        cards: [
          {
            title: "Expert Solutions",
            description: "Industry-leading expertise and proven results",
          },
          {
            title: "Customer Focus",
            description: "Dedicated to your success with personalized support",
          },
          {
            title: "Innovation",
            description: "Cutting-edge technology and forward-thinking approaches",
          }
        ]
      },
      benefits: {
        title: "Our Features",
        items: [
          {
            title: "Comprehensive Solutions",
            description: "End-to-end services tailored to your needs"
          },
          {
            title: "Expert Support",
            description: "24/7 assistance from our dedicated team"
          },
          {
            title: "Proven Results",
            description: "Track record of success with satisfied clients"
          }
        ]
      },
      testimonials: {
        title: "What Our Clients Say",
        items: [
          {
            quote: "A game-changing solution that transformed our business.",
            author: "Jane Smith",
            role: "CEO, Tech Solutions Inc."
          }
        ]
      },
      pricing: {
        title: "Simple, Transparent Pricing",
        description: "Choose the plan that's right for you",
        items: [
          {
            title: "Starter",
            price: "$49/mo",
            features: ["Basic features", "Email support", "1 user"]
          },
          {
            title: "Professional",
            price: "$99/mo",
            features: ["Advanced features", "Priority support", "5 users"]
          }
        ]
      }
    };

    // Update log for content generation
    await supabase
      .from('landing_page_generation_logs')
      .update({
        step_details: { stage: 'content_generated' },
        status: 'generating_images'
      })
      .eq('id', log.id);

    // Generate hero image
    const imagePrompt = `Create a professional, modern hero image for ${businessName}. ${businessIdea}. Style: clean, corporate, professional.`;
    
    const imageResponse = await fetch(`${supabaseUrl}/functions/v1/generate-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        style: "1-1",
        width: 1024,
        height: 1024,
      }),
    });

    if (!imageResponse.ok) {
      throw new Error('Failed to generate image');
    }

    const imageData = await imageResponse.json();
    
    // Update the hero section with the generated image
    content.hero.image = imageData.images[0];

    // Update log for completion
    await supabase
      .from('landing_page_generation_logs')
      .update({
        status: 'completed',
        step_details: { stage: 'images_generated' },
        success: true,
        response_payload: content
      })
      .eq('id', log.id);

    // Return the generated content
    return new Response(JSON.stringify({ 
      content,
      theme_settings: {
        heroLayout: "centered",
        featuresLayout: "grid",
        benefitsLayout: "grid",
        testimonialsLayout: "grid",
        pricingLayout: "grid"
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
