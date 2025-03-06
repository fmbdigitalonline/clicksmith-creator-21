
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Update to support both environment variable formats
const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID') || Deno.env.get('VITE_FACEBOOK_APP_ID') || '';
const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET') || '';
// Use both possible redirect URI names
const REDIRECT_URI = Deno.env.get('FACEBOOK_REDIRECT_URI') || Deno.env.get('VITE_FACEBOOK_REDIRECT_URI') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Enhanced logging for environment variables and configuration
console.log('facebook-oauth function started with configuration:', {
  facebookAppIdExists: !!FACEBOOK_APP_ID,
  facebookAppIdLength: FACEBOOK_APP_ID?.length,
  facebookAppSecretExists: !!FACEBOOK_APP_SECRET,
  facebookAppSecretLength: FACEBOOK_APP_SECRET?.length,
  redirectUriExists: !!REDIRECT_URI,
  redirectUriValue: REDIRECT_URI,
  supabaseUrlExists: !!SUPABASE_URL,
  supabaseServiceRoleKeyExists: !!SUPABASE_SERVICE_ROLE_KEY
});

// Create Supabase client for admin operations
const createClient = (supabaseUrl: string, supabaseKey: string) => {
  return {
    from: (table: string) => ({
      upsert: (data: any, options: any) => {
        console.log(`Attempting to upsert data into ${table}:`, JSON.stringify(data, null, 2));
        console.log('Upsert options:', JSON.stringify(options, null, 2));
        
        // Deep clone the data to avoid any reference issues
        const dataToSave = JSON.parse(JSON.stringify(data));
        
        // Log access token length but not the actual token
        if (dataToSave.access_token) {
          console.log('Access token length:', dataToSave.access_token.length);
          // Don't log the actual token for security
        }
        
        return fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': options?.onConflict ? `resolution=merge-duplicates,merge-keys=user_id,platform` : ''
          },
          body: JSON.stringify(dataToSave),
        }).then(async (res) => {
          if (!res.ok) {
            const error = await res.json();
            console.error(`Error upserting data into ${table}:`, error);
            return { data: null, error };
          }
          const data = await res.json();
          console.log(`Successfully upserted data into ${table}`);
          return { data, error: null };
        }).catch(err => {
          console.error(`Exception in database operation on ${table}:`, err);
          return { data: null, error: err };
        });
      },
      select: (columns: string) => ({
        eq: (field: string, value: any) => {
          console.log(`Selecting from ${table} where ${field} = ${value}`);
          return fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}&${field}=eq.${value}`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            }
          }).then(async (res) => {
            if (!res.ok) {
              const error = await res.json();
              console.error(`Error selecting from ${table}:`, error);
              return { data: null, error };
            }
            const data = await res.json();
            console.log(`Successfully selected from ${table}, found ${data.length} records`);
            return { data, error: null };
          }).catch(err => {
            console.error(`Exception in database query on ${table}:`, err);
            return { data: null, error: err };
          });
        }
      })
    }),
    auth: {
      getUser: async (token: string) => {
        try {
          console.log('Getting user from auth token');
          const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'apikey': supabaseKey,
            }
          });
          if (!res.ok) {
            const error = await res.json();
            console.error('Error getting user from auth token:', error);
            return { data: { user: null }, error };
          }
          const user = await res.json();
          console.log('Successfully retrieved user from auth token, user ID:', user.id);
          return { data: { user }, error: null };
        } catch (error) {
          console.error('Exception in getUser:', error);
          return { data: { user: null }, error };
        }
      }
    }
  };
};

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

async function exchangeCodeForToken(code: string) {
  console.log('Exchanging code for token');
  
  // Create URL params with required fields
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    client_secret: FACEBOOK_APP_SECRET,
    redirect_uri: REDIRECT_URI,
    code: code,
  });

  console.log('Token exchange parameters:', {
    clientIdLength: FACEBOOK_APP_ID.length,
    clientSecretLength: FACEBOOK_APP_SECRET.length,
    redirectUri: REDIRECT_URI,
    codeLength: code.length,
    fullUrl: `https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`
  });

  try {
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`,
      { method: 'GET' }
    );

    console.log('Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Error exchanging code for token:', errorText);
      throw new Error(`Failed to exchange code for token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful, access token received, length:', tokenData.access_token?.length);
    return tokenData;
  } catch (error) {
    console.error('Exception in exchangeCodeForToken:', error);
    throw error;
  }
}

async function getAdAccounts(accessToken: string) {
  console.log('Getting ad accounts with expanded permissions');
  
  try {
    // Request with expanded permissions to include business_management
    // Add fields for more comprehensive ad account data
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_id,account_status,currency,business,timezone_name,funding_source_details,capabilities,owner,amount_spent,min_daily_budget&limit=100&access_token=${accessToken}`,
      { method: 'GET' }
    );

    console.log('Ad accounts response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching ad accounts:', errorText);
      throw new Error(`Failed to fetch ad accounts: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Found ${data.data?.length || 0} ad accounts`);
    if (data.data?.length > 0) {
      console.log('Sample ad account:', JSON.stringify(data.data[0], null, 2));
    }
    return data;
  } catch (error) {
    console.error('Error in getAdAccounts:', error);
    throw error;
  }
}

async function getPages(accessToken: string) {
  console.log('Getting Facebook pages');
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,followers_count,fan_count&limit=100&access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching pages:', errorText);
      throw new Error(`Failed to fetch pages: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Found ${data.data?.length || 0} Facebook pages`);
    if (data.data?.length > 0) {
      console.log('Sample page:', JSON.stringify(data.data[0], null, 2));
    }
    return data;
  } catch (error) {
    console.error('Error in getPages:', error);
    throw error;
  }
}

async function getUserInfo(accessToken: string) {
  console.log('Getting user information');
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching user info:', errorText);
      throw new Error(`Failed to fetch user info: ${errorText}`);
    }

    const data = await response.json();
    console.log('User info retrieved successfully:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error in getUserInfo:', error);
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

    console.log('Token validation response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error validating token:', errorText);
      return false;
    }

    const data = await response.json();
    console.log('Token validation result:', data.data?.is_valid === true ? 'valid' : 'invalid');
    if (data.data?.is_valid) {
      console.log('Token scopes:', data.data?.scopes);
      console.log('Token data:', JSON.stringify(data.data, null, 2));
    }
    return data.data?.is_valid === true;
  } catch (error) {
    console.error('Error in validateToken:', error);
    return false;
  }
}

async function saveConnectionToDatabase(
  userId: string, 
  platform: string, 
  accessToken: string, 
  refreshToken: string | null, 
  expiresAt: Date | null, 
  accountId: string | null, 
  accountName: string | null,
  adAccounts: any[] | null,
  pages: any[] | null
) {
  console.log('Saving connection to database for user:', userId);
  
  try {
    // First check if a connection already exists for this user/platform
    const { data: existingConnection, error: queryError } = await supabaseAdmin
      .from('platform_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform);
    
    if (queryError) {
      console.error('Error checking for existing connection:', queryError);
    } else {
      console.log(`Found ${existingConnection?.length || 0} existing connections for this user/platform`);
    }
    
    // Prepare metadata object
    const metadata = {
      ad_accounts: adAccounts || [],
      pages: pages || [],
      selected_account_id: accountId,
      last_fetched: new Date().toISOString()
    };
    
    console.log('Prepared metadata structure:', JSON.stringify(metadata, null, 2));
    
    // Store connection with ad accounts and pages as metadata
    const { data, error } = await supabaseAdmin
      .from('platform_connections')
      .upsert({
        user_id: userId,
        platform: platform,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: expiresAt,
        account_id: accountId,
        account_name: accountName,
        metadata: metadata
      }, {
        onConflict: 'user_id, platform'
      });

    if (error) {
      console.error('Error saving connection to database:', error);
      throw new Error(`Failed to save connection: ${error.message}`);
    }

    console.log('Successfully saved connection to database with ad accounts and pages');
    return data;
  } catch (error) {
    console.error('Error in saveConnectionToDatabase:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders, 
      status: 204 
    });
  }

  try {
    console.log('Received request:', req.method, req.url);
    
    // Print all request headers for debugging
    const requestHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      requestHeaders[key] = value;
    });
    console.log('Request headers:', requestHeaders);
    
    // Extended environment variable logging
    console.log('Environment configuration:', {
      FACEBOOK_APP_ID_exists: !!FACEBOOK_APP_ID,
      FACEBOOK_APP_ID_length: FACEBOOK_APP_ID?.length,
      FACEBOOK_APP_SECRET_exists: !!FACEBOOK_APP_SECRET,
      FACEBOOK_APP_SECRET_length: FACEBOOK_APP_SECRET?.length,
      REDIRECT_URI_exists: !!REDIRECT_URI,
      REDIRECT_URI_value: REDIRECT_URI,
      ENV_keys: Object.keys(Deno.env.toObject()).filter(key => !key.includes('SECRET')).join(', ')
    });
    
    // Validate environment variables
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !REDIRECT_URI) {
      console.error('Missing required environment variables:', {
        FACEBOOK_APP_ID: !!FACEBOOK_APP_ID,
        FACEBOOK_APP_SECRET: !!FACEBOOK_APP_SECRET,
        REDIRECT_URI: !!REDIRECT_URI
      });
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Server configuration error: Missing Facebook credentials',
        details: {
          appIdPresent: !!FACEBOOK_APP_ID,
          appIdLength: FACEBOOK_APP_ID?.length,
          appSecretPresent: !!FACEBOOK_APP_SECRET,
          appSecretLength: FACEBOOK_APP_SECRET?.length,
          redirectUriPresent: !!REDIRECT_URI,
          redirectUri: REDIRECT_URI
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request body
    let requestBody = {};
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        requestBody = await req.json();
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
      } catch (e) {
        console.error('Error parsing JSON request body:', e);
      }
    }
    
    // Get code from request body or URL parameter
    const url = new URL(req.url);
    const codeFromParam = url.searchParams.get('code');
    const codeFromBody = requestBody.code;
    const code = codeFromBody || codeFromParam;
    
    const authToken = req.headers.get('Authorization')?.split(' ')[1];
    
    // Log request details
    console.log('Request parameters:', { 
      code: code ? `present (${code.length} chars)` : 'missing', 
      authToken: authToken ? `present (${authToken.length} chars)` : 'missing' 
    });
    
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
        error: 'Invalid user token',
        details: userError
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('User authenticated:', user.id);

    // Exchange the code for an access token
    const tokenData = await exchangeCodeForToken(code);
    console.log('Token exchange successful with data:', JSON.stringify({
      access_token_length: tokenData.access_token?.length,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in
    }, null, 2));

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

    // Get user information
    const userInfo = await getUserInfo(tokenData.access_token);
    console.log('Facebook user info:', userInfo);

    // Get ad accounts for the user
    const adAccountsData = await getAdAccounts(tokenData.access_token);
    console.log('Ad accounts fetched successfully');

    // Get pages for the user
    const pagesData = await getPages(tokenData.access_token);
    console.log('Pages fetched successfully');

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

    // Save the connection to the database with ad accounts and pages
    await saveConnectionToDatabase(
      user.id,
      'facebook',
      tokenData.access_token,
      tokenData.refresh_token || null,
      expiresAt,
      accountId,
      accountName,
      adAccountsData?.data || [],
      pagesData?.data || []
    );
    
    return new Response(JSON.stringify({
      success: true,
      platform: 'facebook',
      accountId,
      accountName,
      adAccounts: adAccountsData?.data || [],
      pages: pagesData?.data || [],
      message: 'Successfully connected to Facebook Ads'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in Facebook OAuth:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
