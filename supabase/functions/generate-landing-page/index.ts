
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, businessIdea, targetAudience, userId } = await req.json();
    console.log('📝 Starting landing page generation for project:', projectId);
    console.log('Business idea:', businessIdea);
    console.log('Target audience:', targetAudience);

    if (!projectId || !userId) {
      throw new Error('Missing required parameters: projectId and userId');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Generate base content structure matching frontend expectations
    const landingPageContent = {
      hero: {
        title: businessIdea?.valueProposition || "Welcome to Our Solution",
        description: businessIdea?.description || "Discover how we can help transform your business",
        cta: "Get Started Now",
        image: null // placeholder for future image generation
      },
      value_proposition: {
        title: "Why Choose Us",
        description: "We offer the best solution for your needs",
        cards: [
          {
            title: "Expert Solution",
            description: businessIdea?.valueProposition || "Professional quality results every time",
            icon: "✨"
          },
          {
            title: "Tailored Approach",
            description: "Customized to your specific needs",
            icon: "🎯"
          },
          {
            title: "Proven Results",
            description: "Join our satisfied customers",
            icon: "🌟"
          }
        ]
      },
      features: {
        title: "Key Features",
        description: "Discover what makes us different",
        items: [
          {
            title: "Easy to Use",
            description: "Intuitive interface designed for efficiency",
            icon: "💡"
          },
          {
            title: "Powerful Features",
            description: "Everything you need in one place",
            icon: "⚡"
          },
          {
            title: "Professional Support",
            description: "We're here to help you succeed",
            icon: "🤝"
          }
        ]
      },
      proof: {
        title: "What Our Clients Say",
        items: [
          {
            quote: `As a ${targetAudience?.demographics || 'professional'}, I found this solution exactly what I needed.`,
            author: "John Smith",
            role: targetAudience?.demographics || "Business Owner"
          },
          {
            quote: "The results exceeded our expectations.",
            author: "Sarah Johnson",
            role: "Marketing Director"
          }
        ]
      },
      pricing: {
        title: "Simple, Transparent Pricing",
        description: "Choose the plan that's right for you",
        items: [
          {
            name: "Starter",
            price: "$49/mo",
            features: [
              "Core features",
              "Basic support",
              "Up to 1000 users"
            ]
          },
          {
            name: "Professional",
            price: "$99/mo",
            features: [
              "All Starter features",
              "Priority support",
              "Advanced analytics"
            ]
          }
        ]
      },
      faq: {
        title: "Frequently Asked Questions",
        items: [
          {
            question: "How does it work?",
            answer: "Our platform is designed to be intuitive and easy to use. Simply sign up and follow our guided setup process."
          },
          {
            question: "What support do you offer?",
            answer: "We offer comprehensive support including documentation, email support, and live chat for our premium customers."
          }
        ]
      },
      finalCta: {
        title: "Ready to Get Started?",
        description: "Join thousands of satisfied customers and transform your business today.",
        ctaText: "Start Now"
      },
      footer: {
        content: {
          links: {
            company: ["About", "Contact", "Careers"],
            resources: ["Help Center", "Terms", "Privacy"]
          }
        }
      }
    };

    console.log('📝 Generated content structure:', landingPageContent);

    // Create a unique slug
    const slug = `landing-page-${Math.random().toString(36).substring(2, 8)}`;

    // Insert the landing page
    const { data: landingPage, error: insertError } = await supabaseAdmin
      .from('landing_pages')
      .insert({
        project_id: projectId,
        user_id: userId,
        title: businessIdea?.title || "Untitled Landing Page",
        content: landingPageContent,
        slug,
        published: false,
        content_iterations: 1,
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
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Error inserting landing page:', insertError);
      throw insertError;
    }

    console.log('✅ Landing page created successfully:', landingPage);

    return new Response(
      JSON.stringify(landingPage),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('❌ Error in generate-landing-page function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
