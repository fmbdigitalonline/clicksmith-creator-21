import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Replicate from "https://esm.sh/replicate@0.25.2"
import { deduceRequiredCredits } from "./deepeek.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY')
    const DEEPEEK_API_KEY = Deno.env.get('DEEPEEK_API_KEY')

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables.')
    }

    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY is not set')
    }

    if (!DEEPEEK_API_KEY) {
      throw new Error('DEEPEEK_API_KEY is not set')
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    })

    // Get request body
    const body = await req.json()
    const { projectId, businessIdea, targetAudience, userId } = body

    if (!projectId || !userId) {
      throw new Error('Missing required parameters: projectId and userId are required')
    }

    // Check if user has enough credits
    const { data: creditCheck, error: creditError } = await supabase.rpc(
      'check_user_credits',
      { 
        p_user_id: userId,
        required_credits: deduceRequiredCredits()
      }
    )

    if (creditError) {
      throw new Error(`Error checking credits: ${creditError.message}`)
    }

    if (!creditCheck.has_credits) {
      return new Response(
        JSON.stringify({ 
          error: creditCheck.error_message || 'Insufficient credits'
        }),
        { 
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Deduct credits
    const { data: deductResult, error: deductError } = await supabase.rpc(
      'deduct_user_credits',
      { 
        input_user_id: userId,
        credits_to_deduct: deduceRequiredCredits()
      }
    )

    if (deductError) {
      throw new Error(`Error deducting credits: ${deductError.message}`)
    }

    if (!deductResult.success) {
      throw new Error(deductResult.error_message || 'Failed to deduct credits')
    }

    // Log the generation start
    const { data: log, error: logError } = await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'started',
        request_payload: { businessIdea, targetAudience },
        api_status_code: 200,
        success: true,
        step_details: { stage: 'started' }
      })
      .select()
      .single()

    if (logError) {
      console.error('Error logging generation start:', logError)
    }

    // Generate landing page content
    const prediction = await replicate.run(
      "stability-ai/stable-diffusion:db21e94d56c23f988e2a46ade3f903761c2f462bfcb70a03743c241e758e65a3",
      {
        input: {
          prompt: `Generate a landing page for ${businessIdea.description} targeting ${targetAudience.description}. The landing page should be modern, clean, and professional.`,
        },
      }
    );

    const generatedContent = {
      message: "Landing page generated successfully!",
      prediction,
    };

    // Update the log with success
    if (log) {
      const { error: updateError } = await supabase
        .from('landing_page_generation_logs')
        .update({
          status: 'completed',
          response_payload: generatedContent,
          step_details: { stage: 'completed' }
        })
        .eq('id', log.id)

      if (updateError) {
        console.error('Error updating generation log:', updateError)
      }
    }

    return new Response(
      JSON.stringify(generatedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-landing-page function:', error)

    // Try to log the error
    if (error.message && error.message.includes('user_id') && error.message.includes('credits')) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits or missing subscription'
        }),
        { 
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: `Error generating landing page: ${error.message}` }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
