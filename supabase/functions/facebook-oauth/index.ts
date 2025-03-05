import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID') || '';
const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET') || '';
const REDIRECT_URI = Deno.env.get('FACEBOOK_REDIRECT_URI') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

async function exchangeCodeForToken(code: string) {
  console.log('Exchanging code for token');
  
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    client_secret: FACEBOOK_APP_SECRET,
    redirect_uri: REDIRECT_URI,
    code: code,
  });

  const tokenResponse = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`,
    { method: 'GET' }
  );

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Error exchanging code for token:', errorText);
    throw new Error(`Failed to exchange code for token: ${errorText}`);
  }

  return await tokenResponse.json();
}

async function getAdAccounts(accessToken: string) {
  console.log('Getting ad accounts');
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_id&access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching ad accounts:', errorText);
      throw new Error(`Failed to fetch ad accounts: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Found ${data.data?.length || 0} ad accounts`);
    return data;
  } catch (error) {
    console.error('Error in getAdAccounts:', error);
    throw error;
  }
}

async function validateToken(accessToken: string) {
  console.log('Validating access token');
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error validating token:', errorText);
      return false;
    }

    const data = await response.json();
    return data.data?.is_valid === true;
  } catch (error) {
    console.error('Error in validateToken:', error);
    return false;
  }
}

async function saveConnectionToDatabase(userId: string, platform: string, accessToken: string, refreshToken: string | null, expiresAt: Date | null, accountId: string | null, accountName: string | null) {
  console.log('Saving connection to database for user:', userId);
  
  try {
    const { data, error } = await supabaseAdmin
      .from('platform_connections')
      .upsert({
        user_id: userId,
        platform: platform,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: expiresAt,
        account_id: accountId,
        account_name: accountName
      }, {
        onConflict: 'user_id, platform'
      });

    if (error) {
      console.error('Error saving connection to database:', error);
      throw new Error(`Failed to save connection: ${error.message}`);
    }

    console.log('Successfully saved connection to database');
    return data;
  } catch (error) {
    console.error('Error in saveConnectionToDatabase:', error);
    throw error;
  }
}

// Create Supabase client
const createClient = (supabaseUrl: string, supabaseKey: string) => {
  return {
    from: (table: string) => ({
      upsert: (data: any, options: any) => {
        return fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': options?.onConflict ? `resolution=merge-duplicates,merge-keys=user_id,platform` : ''
          },
          body: JSON.stringify(data),
        }).then(async (res) => {
          if (!res.ok) {
            const error = await res.json();
            return { data: null, error };
          }
          const data = await res.json();
          return { data, error: null };
        });
      }
    }),
    auth: {
      getUser: async (token: string) => {
        const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': supabaseKey,
          }
        });
        if (!res.ok) {
          const error = await res.json();
          return { data: { user: null }, error };
        }
        const user = await res.json();
        return { data: { user }, error: null };
      }
    }
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    console.log('Received request:', req.method, req.url);
    
    // Validate environment variables
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !REDIRECT_URI) {
      console.error('Missing required environment variables:', {
        FACEBOOK_APP_ID: !!FACEBOOK_APP_ID,
        FACEBOOK_APP_SECRET: !!FACEBOOK_APP_SECRET,
        REDIRECT_URI: !!REDIRECT_URI
      });
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Server configuration error: Missing Facebook credentials' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const authToken = req.headers.get('Authorization')?.split(' ')[1];
    
    // Log request details
    console.log('Request parameters:', { code: code ? 'present' : 'missing', authToken: authToken ? 'present' : 'missing' });
    
    if (!code) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Authorization code is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!authToken) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Authorization header is required' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the user from the auth token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authToken);
    
    if (userError || !user) {
      console.error('Invalid user token:', userError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid user token' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('User authenticated:', user.id);

    // Exchange the code for an access token
    const tokenData = await exchangeCodeForToken(code);
    console.log('Token exchange successful');

    // Validate the token
    const isTokenValid = await validateToken(tokenData.access_token);
    if (!isTokenValid) {
      console.error('Invalid token received from Facebook');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid token received from Facebook' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get ad accounts for the user
    const adAccountsData = await getAdAccounts(tokenData.access_token);
    console.log('Ad accounts fetched successfully');

    // Use the first ad account if available
    let accountId = null;
    let accountName = null;
    
    if (adAccountsData && adAccountsData.data && adAccountsData.data.length > 0) {
      accountId = adAccountsData.data[0].id;
      accountName = adAccountsData.data[0].name;
      console.log(`Selected account: ${accountName} (${accountId})`);
    } else {
      console.log('No ad accounts found');
    }

    // Calculate token expiration (if provided)
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000) 
      : null;
    
    if (expiresAt) {
      console.log(`Token expires at: ${expiresAt.toISOString()}`);
    } else {
      console.log('No token expiration provided');
    }

    // Save the connection to the database
    await saveConnectionToDatabase(
      user.id,
      'facebook',
      tokenData.access_token,
      tokenData.refresh_token || null,
      expiresAt,
      accountId,
      accountName
    );
    
    return new Response(JSON.stringify({
      success: true,
      platform: 'facebook',
      accountId,
      accountName,
      message: 'Successfully connected to Facebook Ads'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in Facebook OAuth:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
