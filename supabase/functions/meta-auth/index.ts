
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { serve } from "https://deno.fresh.runtime.dev/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MetaAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { code, redirect_uri } = await req.json()
    
    if (!code) {
      throw new Error('No authorization code provided')
    }

    // Exchange code for access token
    const response = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: Deno.env.get('META_APP_ID'),
        client_secret: Deno.env.get('META_APP_SECRET'),
        redirect_uri,
        code,
      }),
    })

    const data: MetaAuthResponse = await response.json()

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1]
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Store the connection in database
    const { error: insertError } = await supabaseClient
      .from('platform_connections')
      .insert({
        user_id: user.id,
        platform: 'meta',
        access_token: data.access_token,
        token_expires_at: new Date(Date.now() + (data.expires_in * 1000)).toISOString(),
      })

    if (insertError) {
      throw new Error(`Failed to store connection: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
