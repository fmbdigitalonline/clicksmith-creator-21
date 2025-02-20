import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const generateContent = async (businessIdea: any, targetAudience: any, iterationNumber: number = 1) => {
  // Create a structured content object following the landing page formula
  const content = {
    sections: [
      {
        type: 'hero',
        order: 1,
        layout: {
          style: 'split',
          width: 'contained',
          background: 'gradient'
        },
        style: {
          colorScheme: 'light',
          typography: {
            headingSize: 'xlarge'
          }
        },
        content: {
          title: `Transform Your ${businessIdea.industry || 'Business'} with Innovative Solutions`,
          subtitle: `Perfect for ${targetAudience.description || 'businesses'} looking to grow and succeed`,
          mainDescription: businessIdea.description,
          primaryCta: {
            text: "Get Started Now",
            description: "Start your journey today"
          },
          secondaryCta: {
            text: "Learn More",
            description: "See how it works"
          }
        }
      },
      {
        type: 'social-proof',
        order: 2,
        layout: {
          style: 'grid',
          width: 'contained'
        },
        style: {
          colorScheme: 'light',
          textAlign: 'center'
        },
        content: {
          title: "Trusted by Leading Companies",
          items: [
            { title: "50+", description: "Satisfied Clients" },
            { title: "98%", description: "Customer Satisfaction" },
            { title: "24/7", description: "Support Available" }
          ]
        }
      },
      {
        type: 'value-proposition',
        order: 3,
        layout: {
          style: 'grid',
          width: 'contained'
        },
        style: {
          colorScheme: 'light'
        },
        content: {
          title: "Why Choose Us",
          subtitle: `We understand the unique challenges of ${businessIdea.industry || 'your industry'}`,
          items: [
            {
              title: "Expert Solutions",
              description: "Tailored to your specific needs",
              highlights: ["Professional", "Customized", "Efficient"]
            },
            {
              title: "Proven Results",
              description: "Track record of success",
              highlights: ["Data-Driven", "Measurable", "Impactful"]
            },
            {
              title: "Dedicated Support",
              description: "Always here to help",
              highlights: ["24/7", "Responsive", "Knowledgeable"]
            }
          ]
        }
      },
      {
        type: 'features',
        order: 4,
        layout: {
          style: 'columns',
          width: 'contained',
          spacing: 'spacious'
        },
        style: {
          colorScheme: 'light'
        },
        content: {
          title: "Powerful Features",
          subtitle: "Everything you need to succeed",
          items: [
            {
              title: "Comprehensive Solutions",
              description: "End-to-end service tailored to your needs",
              details: ["Custom strategies", "Flexible options", "Scalable solutions"]
            },
            {
              title: "Expert Support",
              description: "Professional guidance every step of the way",
              details: ["Dedicated team", "Regular updates", "Priority support"]
            }
          ]
        }
      },
      {
        type: 'testimonials',
        order: 5,
        layout: {
          style: 'grid',
          width: 'narrow'
        },
        style: {
          colorScheme: 'light'
        },
        content: {
          title: "What Our Clients Say",
          items: [
            {
              title: "Outstanding Results",
              description: "Working with this team has transformed our business. The results exceeded our expectations.",
              details: ["CEO, Industry Leader"]
            }
          ]
        }
      },
      {
        type: 'cta',
        order: 6,
        layout: {
          width: 'contained',
          background: 'gradient'
        },
        style: {
          colorScheme: 'light',
          textAlign: 'center'
        },
        content: {
          title: "Ready to Get Started?",
          subtitle: "Join our satisfied clients and transform your business today",
          primaryCta: {
            text: "Start Now",
            description: "No credit card required"
          }
        }
      }
    ]
  };

  return content;
};

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    const requestBody = await req.json();
    const { projectId, businessIdea, targetAudience, iterationNumber } = requestBody;

    if (!projectId || !businessIdea || !targetAudience) {
      return new Response(
        JSON.stringify({ error: 'Missing projectId, businessIdea, or targetAudience' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Params:', businessIdea, targetAudience)

    // Log the start of the landing page generation
    await supabaseClient
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        user_id: user.id,
        status: 'started',
        step_details: { stage: 'started', timestamp: new Date().toISOString() },
        request_payload: { businessIdea, targetAudience },
      });

    // Generate content
    const content = await generateContent(businessIdea, targetAudience, iterationNumber);

    // Log the content generation
    await supabaseClient
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        user_id: user.id,
        status: 'content_generated',
        step_details: { stage: 'content_generated', timestamp: new Date().toISOString() },
        request_payload: { businessIdea, targetAudience },
        response_payload: { content },
        success: true
      });

    // Update the landing page content in the database
    const { data, error } = await supabaseClient
      .from('landing_pages')
      .update({ content: content, content_iterations: iterationNumber })
      .eq('project_id', projectId)
      .select();

    if (error) {
      console.error('Error updating landing page:', error);

      await supabaseClient
        .from('landing_page_generation_logs')
        .insert({
          project_id: projectId,
          user_id: user.id,
          status: 'failed',
          step_details: { stage: 'failed', timestamp: new Date().toISOString() },
          request_payload: { businessIdea, targetAudience },
          error_message: error.message,
          success: false
        });

      return new Response(JSON.stringify({ error: 'Failed to update landing page' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ data, content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
