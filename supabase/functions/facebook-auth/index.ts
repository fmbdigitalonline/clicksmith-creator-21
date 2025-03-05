
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FACEBOOK_APP_ID = Deno.env.get("FACEBOOK_APP_ID");
const FACEBOOK_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET");
const REDIRECT_URI = Deno.env.get("FACEBOOK_REDIRECT_URI");

if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !REDIRECT_URI) {
  console.error("Missing required environment variables for Facebook authentication");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const { action, code, state, savedState } = await req.json();

    // Get authentication URL for redirect
    if (action === 'get_auth_url') {
      const scopes = ['ads_management', 'ads_read', 'business_management'];
      const authUrl = `https://www.facebook.com/v16.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes.join(','))}&state=${state}`;
      
      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Handle callback from Facebook after user authorization
    if (action === 'exchange_code') {
      // Verify state to prevent CSRF attacks
      if (state !== savedState) {
        throw new Error("Invalid state parameter");
      }
      
      // Exchange code for access token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v16.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`,
        { method: 'GET' }
      );
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        throw new Error(`Failed to exchange code: ${errorData}`);
      }
      
      const tokenData = await tokenResponse.json();
      const { access_token, expires_in } = tokenData;
      
      // Get user's ad accounts
      const adAccountsResponse = await fetch(
        'https://graph.facebook.com/v16.0/me/adaccounts?fields=name,account_status',
        {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        }
      );
      
      if (!adAccountsResponse.ok) {
        const errorData = await adAccountsResponse.text();
        throw new Error(`Failed to fetch ad accounts: ${errorData}`);
      }
      
      const adAccountsData = await adAccountsResponse.json();
      
      // Get user info for verification
      const userResponse = await fetch(
        'https://graph.facebook.com/v16.0/me?fields=name,email',
        {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        }
      );
      
      if (!userResponse.ok) {
        const errorData = await userResponse.text();
        throw new Error(`Failed to fetch user info: ${errorData}`);
      }
      
      const userData = await userResponse.json();
      
      // Return the token, user info and adAccounts
      return new Response(JSON.stringify({
        access_token,
        expires_in,
        user: userData,
        adAccounts: adAccountsData.data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Handle token verification
    if (action === 'verify_token') {
      const { token } = await req.json();
      
      const debugResponse = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`,
        { method: 'GET' }
      );
      
      if (!debugResponse.ok) {
        const errorData = await debugResponse.text();
        throw new Error(`Failed to verify token: ${errorData}`);
      }
      
      const debugData = await debugResponse.json();
      
      return new Response(JSON.stringify(debugData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Handle token disconnection
    if (action === 'disconnect') {
      // Note: We don't actually revoke the token on Facebook's end here
      // as it requires user interaction, but we can delete it from our database
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in facebook-auth function:", error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
