
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { code, state } = await req.json()
    const clientId = Deno.env.get('FACEBOOK_CLIENT_ID')
    const clientSecret = Deno.env.get('FACEBOOK_CLIENT_SECRET')
    const redirectUri = `${Deno.env.get('SITE_URL')}/facebook-callback`

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${clientId}&` +
      `client_secret=${clientSecret}&` +
      `code=${code}&` +
      `redirect_uri=${redirectUri}`
    )

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token')
    }

    // Get user's ad account info
    const accountResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=name,id,currency`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        }
      }
    )

    const accountData = await accountResponse.json()
    const adAccount = accountData.data[0] // Get first ad account for now

    // Store the connection in our database
    const { data: connection, error } = await supabase
      .from('platform_connections')
      .upsert({
        user_id: state, // state contains the user_id
        platform: 'facebook',
        access_token: tokenData.access_token,
        account_id: adAccount.id,
        account_name: adAccount.name,
        token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, connection }),
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
