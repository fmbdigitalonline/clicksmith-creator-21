
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const facebookAppId = Deno.env.get('FACEBOOK_APP_ID') as string;
const facebookAppSecret = Deno.env.get('FACEBOOK_APP_SECRET') as string;
const redirectUri = Deno.env.get('FACEBOOK_REDIRECT_URI') as string;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const action = params.get('action');

    // Handle authentication flow
    if (action === 'redirect') {
      // Create Facebook OAuth URL
      const scope = 'ads_management,business_management,ads_read';
      const facebookAuthUrl = `https://www.facebook.com/v16.0/dialog/oauth?client_id=${facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;

      return new Response(JSON.stringify({ url: facebookAuthUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } 
    
    if (action === 'callback') {
      const code = params.get('code');
      
      if (!code) {
        throw new Error('No authorization code provided');
      }

      // Exchange code for access token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v16.0/oauth/access_token?client_id=${facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${facebookAppSecret}&code=${code}`,
        { method: 'GET' }
      );

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(`Facebook API Error: ${tokenData.error.message}`);
      }

      const { access_token, expires_in } = tokenData;
      
      // Get user details and account info
      const accountResponse = await fetch(
        `https://graph.facebook.com/v16.0/me/adaccounts?fields=name,account_id&access_token=${access_token}`,
        { method: 'GET' }
      );

      const accountData = await accountResponse.json();
      
      // Get user ID from authorization header
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing Authorization header');
      }
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        throw new Error('Unable to get user information');
      }

      // Store connection in database
      if (accountData.data && accountData.data.length > 0) {
        const adAccount = accountData.data[0];
        
        const { error: connectionError } = await supabase
          .from('platform_connections')
          .upsert({
            user_id: user.id,
            platform: 'facebook',
            access_token,
            token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
            account_id: adAccount.account_id,
            account_name: adAccount.name
          }, { onConflict: 'user_id,platform' });

        if (connectionError) {
          throw new Error(`Database error: ${connectionError.message}`);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Facebook account connected successfully',
        accounts: accountData.data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user's connected accounts
    if (action === 'get-connections') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing Authorization header');
      }
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        throw new Error('Unable to get user information');
      }

      const { data: connections, error: connectionsError } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'facebook');

      if (connectionsError) {
        throw new Error(`Database error: ${connectionsError.message}`);
      }

      return new Response(JSON.stringify({ connections }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in facebook-auth function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
