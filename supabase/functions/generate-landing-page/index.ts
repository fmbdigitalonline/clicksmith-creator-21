
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateContent } from "./deepeek.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BusinessIdea {
  description: string;
  valueProposition: string;
}

interface TargetAudience {
  demographics: any;
  interests: string[];
  painPoints: string[];
}

const validateBusinessIdea = (businessIdea: any): businessIdea is BusinessIdea => {
  return (
    businessIdea &&
    typeof businessIdea.description === 'string' &&
    typeof businessIdea.valueProposition === 'string'
  );
};

const validateTargetAudience = (targetAudience: any): targetAudience is TargetAudience => {
  return (
    targetAudience &&
    targetAudience.demographics &&
    Array.isArray(targetAudience.interests) &&
    Array.isArray(targetAudience.painPoints)
  );
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const DEEPEEK_API_KEY = Deno.env.get('DEEPEEK_API_KEY')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DEEPEEK_API_KEY) {
      throw new Error('Missing required environment variables')
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { projectId, businessIdea, targetAudience, userId } = await req.json()

    // Validate required parameters
    if (!projectId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: projectId and userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate business idea structure
    if (!validateBusinessIdea(businessIdea)) {
      return new Response(
        JSON.stringify({ error: 'Invalid business idea structure' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate target audience structure
    if (!validateTargetAudience(targetAudience)) {
      return new Response(
        JSON.stringify({ error: 'Invalid target audience structure' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check user credits
    const { data: creditCheck, error: creditError } = await supabase.rpc(
      'check_user_credits',
      { 
        p_user_id: userId,
        required_credits: 2 // Initial generation cost
      }
    )

    if (creditError) {
      console.error('Credit check error:', creditError)
      throw new Error('Failed to check credits')
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

    // Create generation log
    const { data: log, error: logError } = await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'started',
        request_payload: { businessIdea, targetAudience },
        step_details: { stage: 'started' }
      })
      .select()
      .single()

    if (logError) {
      console.error('Error creating generation log:', logError)
    }

    // Generate content
    const content = await generateContent({
      businessIdea,
      targetAudience,
      userId
    })

    // Save generated content
    const { error: saveError } = await supabase
      .from('landing_pages')
      .upsert({
        project_id: projectId,
        user_id: userId,
        content,
        content_iterations: 1
      })

    if (saveError) {
      throw new Error(`Failed to save landing page: ${saveError.message}`)
    }

    // Update log with success
    if (log) {
      await supabase
        .from('landing_page_generation_logs')
        .update({
          status: 'completed',
          response_payload: content,
          step_details: { stage: 'completed' }
        })
        .eq('id', log.id)
    }

    // Deduct credits
    const { data: deductResult, error: deductError } = await supabase.rpc(
      'deduct_user_credits',
      { 
        input_user_id: userId,
        credits_to_deduct: 2
      }
    )

    if (deductError || !deductResult.success) {
      throw new Error('Failed to deduct credits')
    }

    return new Response(
      JSON.stringify({
        content,
        projectId,
        creditsUsed: 2,
        creditsRemaining: deductResult.current_credits
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-landing-page function:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
