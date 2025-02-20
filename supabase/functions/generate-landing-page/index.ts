
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
    console.log('📝 Request payload:', { projectId, userId });
    console.log('📝 Business idea:', businessIdea);
    console.log('📝 Target audience:', targetAudience);

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

    console.log('🔄 Generating landing page content...');
    const landingPageContent = {
      hero: {
        title: businessIdea?.valueProposition || "Welcome",
        description: businessIdea?.description || "",
        cta: "Get Started Now"
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
          content: `As a ${targetAudience?.demographics || 'professional'}, I found this solution incredibly helpful.`
        }
      ],
      callToAction: {
        title: "Ready to Get Started?",
        description: "Join thousands of satisfied customers and transform your business today.",
        buttonText: "Start Now"
      }
    };

    console.log('📝 Generated content:', landingPageContent);

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
