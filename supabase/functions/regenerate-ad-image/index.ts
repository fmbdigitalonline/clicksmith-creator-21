
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateWithReplicate } from "../generate-ad-content/handlers/utils/replicateUtils.ts";
import { buildVariationPrompt } from "../generate-ad-content/handlers/utils/promptBuilder.ts";

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
    const { projectId, adId, businessIdea, targetAudience, hook, dimensions } = await req.json();

    console.log('Regenerating image with params:', { projectId, adId, dimensions });

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Create regeneration record
    const { data: regeneration, error: insertError } = await supabase
      .from('ad_image_regenerations')
      .insert({
        user_id: user.id,
        project_id: projectId,
        prompt: buildVariationPrompt(businessIdea, targetAudience, hook),
        dimensions,
        status: 'pending',
        metadata: { adId }
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create regeneration record: ${insertError.message}`);
    }

    // Generate new image
    console.log('Generating new image...');
    const imageUrl = await generateWithReplicate(regeneration.prompt, {
      width: dimensions.width,
      height: dimensions.height
    });

    // Update regeneration record with result
    const { error: updateError } = await supabase
      .from('ad_image_regenerations')
      .update({
        new_image_url: imageUrl,
        status: 'completed'
      })
      .eq('id', regeneration.id);

    if (updateError) {
      throw new Error(`Failed to update regeneration record: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        regenerationId: regeneration.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in regenerate-ad-image function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
