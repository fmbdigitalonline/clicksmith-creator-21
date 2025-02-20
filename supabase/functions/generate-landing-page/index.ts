
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

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
    if (!projectId || !businessIdea || !userId) {
      throw new Error('Missing required parameters: projectId, businessIdea, and userId are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get project title first
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single();

    if (projectError) {
      throw projectError;
    }

    // Generate the landing page content
    const content = {
      hero: {
        title: businessIdea.valueProposition || project.title || "Untitled Landing Page",
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
      testimonials: targetAudience ? {
        title: "What Our Clients Say",
        items: [
          {
            quote: "A game-changing solution that transformed our business.",
            author: "Jane Smith",
            role: targetAudience.demographics || "CEO"
          }
        ]
      } : null
    };

    // Generate a unique slug based on the project title
    const baseSlug = (project.title || "untitled")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomSuffix}`;

    // Create the landing page
    const { data: landingPage, error: createError } = await supabase
      .from('landing_pages')
      .insert({
        project_id: projectId,
        user_id: userId,
        title: project.title || "Untitled Landing Page", // Ensure we always have a title
        content,
        slug,
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
      .select()
      .single();

    if (createError) {
      console.error('Error creating landing page:', createError);
      throw createError;
    }

    // Return the generated content
    return new Response(
      JSON.stringify({
        content,
        theme_settings: landingPage.theme_settings,
        landingPageId: landingPage.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in generate-landing-page function:', error);
    
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
