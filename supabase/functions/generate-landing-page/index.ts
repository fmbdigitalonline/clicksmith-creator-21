
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { deepeek } from "./deepeek.ts";

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
    const { projectId, businessIdea, targetAudience, userId } = await req.json();

    // Validate required parameters
    if (!projectId || !businessIdea || !targetAudience || !userId) {
      throw new Error('Missing required parameters');
    }

    console.log('Starting landing page generation for project:', projectId);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch project images from ad_feedback
    const { data: imageData, error: imageError } = await supabase
      .from('ad_feedback')
      .select('imageurl, saved_images')
      .eq('project_id', projectId)
      .not('imageurl', 'is', null);

    if (imageError) {
      console.error('Error fetching project images:', imageError);
    }

    // Collect all available images
    const projectImages = imageData?.reduce((acc: string[], item) => {
      if (item.imageurl) acc.push(item.imageurl);
      if (item.saved_images && Array.isArray(item.saved_images)) {
        acc.push(...item.saved_images);
      }
      return acc;
    }, []) || [];

    console.log('Found project images:', projectImages);

    // Create a new generation log entry
    const { data: logEntry, error: logError } = await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'started',
        step_details: { stage: 'started' }
      })
      .select()
      .single();

    if (logError) throw logError;

    // Get the latest version number for this project
    const { data: latestVersion } = await supabase
      .from('landing_pages')
      .select('id, version')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const newVersion = (latestVersion?.version || 0) + 1;
    const previousVersionId = latestVersion?.id;

    console.log('Generating content for version:', newVersion);

    // Start generating content
    await supabase
      .from('landing_page_generation_logs')
      .update({
        status: 'generating_content',
        step_details: { stage: 'content_generated' }
      })
      .eq('id', logEntry.id);

    const content = await deepeek.generateLandingPageContent(businessIdea, targetAudience, projectImages);

    console.log('Content generated successfully');

    // Create new landing page version
    const { data: newLandingPage, error: insertError } = await supabase
      .from('landing_pages')
      .insert({
        project_id: projectId,
        user_id: userId,
        content,
        version: newVersion,
        previous_version_id: previousVersionId,
        generation_started_at: new Date().toISOString(),
        content_iterations: newVersion,
        title: `Landing Page v${newVersion}`
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log('New landing page version created:', newLandingPage.id);

    // Update log with success
    await supabase
      .from('landing_page_generation_logs')
      .update({
        status: 'completed',
        success: true,
        step_details: { stage: 'completed' }
      })
      .eq('id', logEntry.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: newLandingPage,
        message: 'Landing page generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-landing-page function:', error);

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
