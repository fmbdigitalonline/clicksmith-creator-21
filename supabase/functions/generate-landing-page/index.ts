
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
    const { projectId, businessIdea, targetAudience, userId, iterationNumber = 1 } = await req.json();
    console.log('Starting landing page generation for project:', projectId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase environment variables');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the existing landing page with content
    const { data: existingPages } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('project_id', projectId)
      .order('content_iterations', { ascending: false });

    const existingPage = existingPages?.find(page => 
      page.content && Object.keys(page.content).length > 0
    ) || existingPages?.[0];

    // Log generation start
    const { error: logError } = await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'generation_started',
        step_details: {
          stage: 'started',
          timestamp: new Date().toISOString()
        }
      });

    if (logError) {
      console.error('Error logging generation start:', logError);
    }

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

    // Generate the landing page content based on business idea and target audience
    const landingPageContent = {
      sections: [
        {
          type: 'hero',
          order: 1,
          content: {
            headline: `Transform Your ${businessIdea.industry || 'Business'} with Our Solution`,
            subheadline: `Designed for ${targetAudience.name || 'Your Audience'}`,
            description: businessIdea.description || 'Welcome to our platform',
            ctaText: 'Get Started Today'
          }
        },
        {
          type: 'social-proof',
          order: 2,
          content: {
            headline: 'Trusted by Industry Leaders',
            testimonials: [
              {
                quote: "This solution transformed our business operations.",
                author: "John Doe",
                company: "Tech Solutions Inc."
              }
            ]
          }
        }
      ]
    };

    // Generate hero image using Replicate
    console.log('Generating hero image...');
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (REPLICATE_API_KEY) {
      try {
        const replicate = new Replicate({
          auth: REPLICATE_API_KEY,
        });

        const imagePrompt = `Create a professional, modern hero image for a ${businessIdea.industry} business targeting ${targetAudience.name}. The image should be clean, minimal, and suitable for a landing page.`;
        
        const imageOutput = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          {
            input: {
              prompt: imagePrompt,
              num_outputs: 1,
              scheduler: "K_EULER",
              num_inference_steps: 50
            }
          }
        );

        if (imageOutput && Array.isArray(imageOutput) && imageOutput[0]) {
          landingPageContent.sections[0].content.imageUrl = imageOutput[0];
          console.log('Hero image generated successfully:', imageOutput[0]);
        }
      } catch (imageError) {
        console.error('Error generating hero image:', imageError);
        // Continue without image if generation fails
      }
    }

    // Update or create the landing page
    const { data: landingPage, error: upsertError } = await supabase
      .from('landing_pages')
      .upsert({
        id: existingPage?.id, // Keep the same ID if it exists
        project_id: projectId,
        user_id: userId,
        content: landingPageContent,
        title: existingPage?.title || "Market Testing & Validation Platform",
        updated_at: new Date().toISOString(),
        content_iterations: iterationNumber || 1
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error storing landing page:', upsertError);
      throw upsertError;
    }

    // Log successful generation
    const { error: successLogError } = await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'generation_completed',
        success: true,
        step_details: {
          stage: 'completed',
          timestamp: new Date().toISOString()
        }
      });

    if (successLogError) {
      console.error('Error logging generation success:', successLogError);
    }

    // Deduct 1 credit after successful generation
    const { data: deductionResult, error: deductionError } = await supabase.rpc(
      'deduct_user_credits',
      { input_user_id: userId, credits_to_deduct: 1 }
    );

    if (deductionError) {
      console.error('Error deducting credits:', deductionError);
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
    
    // Log the error
    if (error instanceof Error) {
      const { projectId, userId } = await req.json().catch(() => ({ projectId: null, userId: null }));
      
      if (projectId && userId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase
            .from('landing_page_generation_logs')
            .insert({
              project_id: projectId,
              user_id: userId,
              status: 'generation_failed',
              success: false,
              error_message: error.message,
              step_details: {
                stage: 'failed',
                timestamp: new Date().toISOString()
              }
            });
        }
      }
    }

    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
