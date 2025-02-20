
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting landing page generation...');
    const { projectId, businessIdea, targetAudience, userId } = await req.json();

    // Validate required parameters
    if (!projectId || !businessIdea) {
      console.error('Missing required parameters:', { projectId, businessIdea });
      throw new Error('Missing required parameters: projectId and businessIdea are required');
    }

    console.log('Parameters received:', { projectId, businessIdea: JSON.stringify(businessIdea) });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log the generation start
    const { data: log, error: logError } = await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        request_payload: { businessIdea, targetAudience },
        status: 'started',
        step_details: { stage: 'started', timestamp: new Date().toISOString() }
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating generation log:', logError);
    }

    // Generate content
    const content = {
      hero: {
        title: businessIdea.title || "Transform Your Business",
        description: businessIdea.description || "Experience innovation and excellence",
        cta: "Get Started Today",
        image: "/placeholder.svg"
      },
      features: {
        title: "Why Choose Us",
        cards: [
          {
            title: "Expert Solutions",
            description: "Industry-leading expertise and proven results"
          },
          {
            title: "Customer Focus",
            description: "Dedicated to your success with personalized support"
          },
          {
            title: "Innovation",
            description: "Cutting-edge technology and forward-thinking approaches"
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
        plans: [
          {
            name: "Starter",
            price: "$99/month",
            features: ["Basic Features", "Email Support", "5 Users"]
          },
          {
            name: "Professional",
            price: "$199/month",
            features: ["Advanced Features", "Priority Support", "Unlimited Users"]
          }
        ]
      },
      faq: {
        title: "Frequently Asked Questions",
        description: "Find answers to common questions about our solutions",
        items: [
          {
            question: "What makes your solution unique?",
            answer: `Our solution stands out through its innovative approach to ${businessIdea.description || 'business challenges'}.`
          },
          {
            question: "How long does implementation take?",
            answer: "Our streamlined process typically enables implementation within 2-4 weeks."
          }
        ]
      }
    };

    // Update log with content generation status
    await supabase
      .from('landing_page_generation_logs')
      .update({
        status: 'completed',
        step_details: { stage: 'completed', timestamp: new Date().toISOString() },
        success: true,
        response_payload: { content }
      })
      .eq('id', log?.id);

    // Create or update landing page in database
    const { error: upsertError } = await supabase
      .from('landing_pages')
      .upsert({
        project_id: projectId,
        content,
        theme_settings: {
          colorScheme: "light",
          typography: {
            headingFont: "Inter",
            bodyFont: "Inter"
          },
          spacing: {
            sectionPadding: "py-16",
            componentGap: "gap-8"
          }
        },
        user_id: userId
      });

    if (upsertError) {
      console.error('Error upserting landing page:', upsertError);
      throw upsertError;
    }

    // Return the generated content
    return new Response(
      JSON.stringify({
        content,
        theme_settings: {
          colorScheme: "light",
          typography: {
            headingFont: "Inter",
            bodyFont: "Inter"
          },
          spacing: {
            sectionPadding: "py-16",
            componentGap: "gap-8"
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in generate-landing-page function:', error);
    
    // Attempt to log the error to Supabase if we can
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from('landing_page_generation_logs')
          .insert({
            status: 'error',
            error_message: error.message,
            step_details: { stage: 'error', timestamp: new Date().toISOString() }
          });
      }
    } catch (logError) {
      console.error('Error logging to Supabase:', logError);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
