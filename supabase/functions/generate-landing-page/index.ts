
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, businessIdea, targetAudience, userId } = await req.json();
    console.log('Received request:', { projectId, businessIdea, targetAudience, userId });

    // Validate required parameters
    if (!projectId || !userId) {
      throw new Error('Missing required parameters: projectId and userId are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized');

    // Generate content
    const content = generateLandingPageContent(businessIdea, targetAudience);
    console.log('Generated content:', content);

    // Generate unique slug
    const slug = generateUniqueSlug(businessIdea?.title || 'landing-page');

    // Create landing page
    const { data: landingPage, error: createError } = await supabase
      .from('landing_pages')
      .insert({
        project_id: projectId,
        user_id: userId,
        title: businessIdea?.title || "Untitled Landing Page",
        content,
        slug,
        published: false,
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

    console.log('Landing page created successfully:', landingPage);

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
    console.error('Error in generate-landing-page function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function generateUniqueSlug(title: string): string {
  const baseSlug = (title || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

function generateLandingPageContent(businessIdea: any, targetAudience: any) {
  return {
    hero: {
      title: businessIdea?.valueProposition || "Welcome",
      description: businessIdea?.description || "",
      cta: "Get Started Now",
    },
    features: [
      {
        title: "Easy to Use",
        description: "Our platform makes it simple to get started"
      },
      {
        title: "Professional Results",
        description: "Get high-quality outputs every time"
      }
    ],
    benefits: [
      "Save time and effort",
      "Professional quality results",
      "Customizable solutions"
    ],
    testimonials: [
      {
        name: "John Doe",
        role: targetAudience?.demographics || "Professional",
        content: `As a ${targetAudience?.demographics || 'user'}, I found this solution incredibly helpful.`
      }
    ],
    callToAction: {
      title: "Ready to Get Started?",
      description: "Join thousands of satisfied customers and transform your business today.",
      buttonText: "Start Now",
    }
  };
}
