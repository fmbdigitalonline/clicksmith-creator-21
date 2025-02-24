
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { deepeek } from "./deepeek.ts";

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
    console.log('Received request:', { projectId, businessIdea, targetAudience, userId });

    if (!projectId || !businessIdea || !targetAudience || !userId) {
      throw new Error('Missing required parameters');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const deepeekApiKey = Deno.env.get('DEEPEEK_API_KEY');

    if (!supabaseUrl || !supabaseKey || !deepeekApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log the start of generation
    await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'started',
        step_details: { stage: 'started', inputs: { businessIdea, targetAudience } }
      });

    // Generate content using Deepeek
    console.log('Generating content with Deepeek...');
    const generatedContent = await deepeek({
      businessIdea,
      targetAudience,
      apiKey: deepeekApiKey,
      version: Math.floor(Math.random() * 1000), // Add randomness to get different variations
    });

    console.log('Generated content:', generatedContent);

    if (!generatedContent) {
      throw new Error('Failed to generate content');
    }

    // Create or update landing page with the new content
    const { data: landingPage, error: updateError } = await supabase
      .from('landing_pages')
      .insert({
        project_id: projectId,
        user_id: userId,
        title: businessIdea.title || 'New Landing Page',
        content: generatedContent,
        theme_settings: generatedContent.theme || {},
        content_iterations: 1,
        generation_status: 'completed',
        generation_metadata: {
          timestamp: new Date().toISOString(),
          version: Math.floor(Math.random() * 1000),
        }
      })
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update landing page: ${updateError.message}`);
    }

    // Log successful generation
    await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'completed',
        success: true,
        step_details: { 
          stage: 'completed',
          generatedContent: generatedContent
        }
      });

    return new Response(
      JSON.stringify({ success: true, data: landingPage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-landing-page function:', error);
    
    // Log the error
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase
        .from('landing_page_generation_logs')
        .insert({
          status: 'error',
          success: false,
          error_message: error.message,
          step_details: { stage: 'error', error: error.message }
        });
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
