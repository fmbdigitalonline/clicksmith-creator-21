import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Update to support both environment variable formats
const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID') || Deno.env.get('VITE_FACEBOOK_APP_ID') || '';
const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET') || '';
// Use both possible redirect URI names
let REDIRECT_URI = Deno.env.get('FACEBOOK_REDIRECT_URI') || Deno.env.get('VITE_FACEBOOK_REDIRECT_URI') || '';
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

// Add zod for schema validation
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Define validation schemas
const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  account_id: z.string(),
  account_status: z.number(),
}).catchall(z.unknown());

const PageSchema = z.object({
  id: z.string(),
  name: z.string(),
}).catchall(z.unknown());

const TokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number().optional(),
}).catchall(z.unknown());

// Add state validation schema
const StateSchema = z.object({
  timestamp: z.number(),
  nonce: z.string(),
  origin: z.string().optional()
}).catchall(z.unknown());

// Improved type definitions for consistent response handling
interface FacebookOAuthResponse {
  success: boolean;
  platform?: string;
  accountId?: string;
  accountName?: string;
  adAccounts?: any[];
  pages?: any[];
  message?: string;
  error?: string;
  details?: Record<string, any>;
  stage?: string;
  stack?: string | null;
}

interface ApiUser {
  id: string;
  email?: string;
  [key: string]: any;
}

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
        
        // Validate metadata if present
        if (dataToSave.metadata) {
          // Ensure ad_accounts is an array
          if (dataToSave.metadata.ad_accounts && !Array.isArray(dataToSave.metadata.ad_accounts)) {
            dataToSave.metadata.ad_accounts = [];
          }
          
          // Ensure pages is an array
          if (dataToSave.metadata.pages && !Array.isArray(dataToSave.metadata.pages)) {
            dataToSave.metadata.pages = [];
          }
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
      }),
      match: (query: Record<string, any>) => {
        const queryParams = new URLSearchParams();
        for (const key in query) {
          queryParams.append(key, `eq.${query[key]}`);
        }
        const queryStr = queryParams.toString();
        console.log(`Selecting from ${table} with query: ${queryStr}`);
        return fetch(`${supabaseUrl}/rest/v1/${table}?${queryStr}`, {
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

async function exchangeCodeForToken(code: string, redirectUri: string) {
  console.log('Exchanging code for token with redirectUri:', redirectUri);
  
  // Create URL params with required fields
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    client_secret: FACEBOOK_APP_SECRET,
    redirect_uri: redirectUri,
    code: code,
  });

  console.log('Token exchange parameters:', {
    clientIdLength: FACEBOOK_APP_ID.length,
    clientSecretLength: FACEBOOK_APP_SECRET.length,
    redirectUri: redirectUri,
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
      
      // Parse error response to check for specific error types
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error && errorData.error.type === 'OAuthException' && 
            errorData.error.message.includes('configured as a desktop app')) {
          throw new Error('Facebook App is incorrectly configured as a desktop app. Please reconfigure it as a web application in the Facebook Developers Console.');
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      throw new Error(`Failed to exchange code for token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    
    // Validate token response
    try {
      TokenResponseSchema.parse(tokenData);
    } catch (error) {
      console.error('Invalid token response format:', error);
      throw new Error('Invalid token response format from Facebook');
    }
    
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
    
    // Validate ad accounts
    if (data.data && Array.isArray(data.data)) {
      try {
        const validatedAccounts = data.data.filter(account => {
          try {
            AccountSchema.parse(account);
            return true;
          } catch (error) {
            console.warn('Invalid ad account data structure, filtering out:', account);
            return false;
          }
        });
        
        // Replace with validated accounts
        data.data = validatedAccounts;
      } catch (error) {
        console.error('Error validating ad accounts:', error);
      }
    }
    
    console.log(`Found ${data.data?.length || 0} valid ad accounts`);
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
    
    // Validate pages
    if (data.data && Array.isArray(data.data)) {
      try {
        const validatedPages = data.data.filter(page => {
          try {
            PageSchema.parse(page);
            return true;
          } catch (error) {
            console.warn('Invalid page data structure, filtering out:', page);
            return false;
          }
        });
        
        // Replace with validated pages
        data.data = validatedPages;
      } catch (error) {
        console.error('Error validating pages:', error);
      }
    }
    
    console.log(`Found ${data.data?.length || 0} valid Facebook pages`);
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
    // First validate all incoming data
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }
    
    if (!platform || typeof platform !== 'string') {
      throw new Error('Invalid platform');
    }
    
    if (!accessToken || typeof accessToken !== 'string') {
      throw new Error('Invalid access token');
    }
    
    // Validate ad accounts and pages
    const validatedAdAccounts = Array.isArray(adAccounts) 
      ? adAccounts.filter(account => {
          try {
            AccountSchema.parse(account);
            return true;
          } catch (error) {
            console.warn('Filtering out invalid ad account:', account);
            return false;
          }
        }) 
      : [];
      
    const validatedPages = Array.isArray(pages) 
      ? pages.filter(page => {
          try {
            PageSchema.parse(page);
            return true;
          } catch (error) {
            console.warn('Filtering out invalid page:', page);
            return false;
          }
        }) 
      : [];
    
    // Check for existing connection using proper query syntax
    const { data: existingConnections, error: queryError } = await supabaseAdmin
      .from('platform_connections')
      .select('*')
      .match({ user_id: userId, platform: platform });
    
    if (queryError) {
      console.error('Error checking for existing connection:', queryError);
    } else {
      console.log(`Found ${existingConnections?.length || 0} existing connections for this user/platform`);
    }
    
    // Prepare metadata object with validation
    const metadata = {
      ad_accounts: validatedAdAccounts,
      pages: validatedPages,
      selected_account_id: accountId,
      last_fetched: new Date().toISOString()
    };
    
    console.log('Prepared validated metadata structure:', JSON.stringify(metadata, null, 2));
    
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

async function validateOAuthState(stateParam: string | null): Promise<boolean> {
  if (!stateParam) {
    console.log("No state parameter provided");
    return true; // Allow no state for backward compatibility
  }
  
  try {
    // Parse the state
    const parsedState = JSON.parse(decodeURIComponent(stateParam));
    
    // Validate with schema
    try {
      StateSchema.parse(parsedState);
    } catch (error) {
      console.error("State parameter failed schema validation:", error);
      return false;
    }
    
    // Check if state is expired (older than 1 hour)
    const stateTime = new Date(parsedState.timestamp);
    const currentTime = new Date();
    const hourInMs = 60 * 60 * 1000;
    
    if (currentTime.getTime() - stateTime.getTime() > hourInMs) {
      console.error("OAuth state expired");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error parsing state parameter:", error);
    return false;
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
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error('Missing required environment variables:', {
        FACEBOOK_APP_ID: !!FACEBOOK_APP_ID,
        FACEBOOK_APP_SECRET: !!FACEBOOK_APP_SECRET,
      });
      
      const response: FacebookOAuthResponse = {
        success: false,
        error: 'Server configuration error: Missing Facebook credentials',
        details: {
          appIdPresent: !!FACEBOOK_APP_ID,
          appIdLength: FACEBOOK_APP_ID?.length,
          appSecretPresent: !!FACEBOOK_APP_SECRET,
          appSecretLength: FACEBOOK_APP_SECRET?.length,
        }
      };
      
      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request body
    let requestBody: any = {};
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        requestBody = await req.json();
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
      } catch (e) {
        console.error('Error parsing JSON request body:', e);
      }
    }
    
    // Get code and state from request body or URL parameter
    const url = new URL(req.url);
    const codeFromParam = url.searchParams.get('code');
    const stateFromParam = url.searchParams.get('state');
    const codeFromBody = requestBody?.code;
    const stateFromBody = requestBody?.state;
    const originFromBody = requestBody?.origin;
    const code = codeFromBody || codeFromParam;
    const state = stateFromBody || stateFromParam;
    
    // Try to extract origin from state parameter
    let stateObject = null;
    try {
      if (state) {
        stateObject = JSON.parse(decodeURIComponent(state));
        console.log('Extracted state object:', stateObject);
      }
    } catch (e) {
      console.error('Error parsing state:', e);
    }
    
    // Use origin from state parameter or body to dynamically set redirect URI
    const originFromState = stateObject?.origin;
    const origin = originFromState || originFromBody || null;
    
    // If we have an origin from state, use it for the redirect URI
    if (origin) {
      REDIRECT_URI = `${origin}/integrations?connection=facebook`;
      console.log('Using dynamic redirect URI from state/origin:', REDIRECT_URI);
    } else if (!REDIRECT_URI) {
      console.error('No redirect URI available from environment or state');
      return new Response(JSON.stringify({
        success: false,
        error: 'No redirect URI available'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const authToken = req.headers.get('Authorization')?.split(' ')[1];
    
    // Log request details
    console.log('Request parameters:', { 
      code: code ? `present (${code.length} chars)` : 'missing', 
      authToken: authToken ? `present (${authToken.length} chars)` : 'missing',
      state: state ? `present (${state.length} chars)` : 'missing',
      origin: origin || 'not provided',
      redirectUri: REDIRECT_URI
    });
    
    if (!code) {
      const response: FacebookOAuthResponse = {
        success: false,
        error: 'Authorization code is required'
      };
      
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!authToken) {
      const response: FacebookOAuthResponse = {
        success: false,
        error: 'Authorization header is required'
      };
      
      return new Response(JSON.stringify(response), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Validate the state parameter
    const isStateValid = await validateOAuthState(state);
    if (state && !isStateValid) {
      const response: FacebookOAuthResponse = {
        success: false,
        error: 'Invalid OAuth state parameter'
      };
      
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the user from the auth token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authToken);
    
    if (userError || !user) {
      console.error('Invalid user token:', userError);
      
      const response: FacebookOAuthResponse = {
        success: false,
        error: 'Invalid user token',
        details: userError
      };
      
      return new Response(JSON.stringify(response), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('User authenticated:', user.id);

    // Track transaction stages for potential rollback
    let transactionStage = 'init';
    let rollbackNeeded = false;
    let savedConnectionId = null;

    // Process the OAuth response with validation
    try {
      transactionStage = 'token_exchange';
      // Exchange the code for an access token - now passing the explicit redirect URI
      const tokenData = await exchangeCodeForToken(code, REDIRECT_URI);
      console.log('Token exchange successful with data:', JSON.stringify({
        access_token_length: tokenData.access_token?.length,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in
      }, null, 2));
      
      transactionStage = 'token_validation';
      // Validate the token
      const isTokenValid = await validateToken(tokenData.access_token);
      if (!isTokenValid) {
        console.error('Invalid token received from Facebook');
        
        const response: FacebookOAuthResponse = {
          success: false,
          error: 'Invalid token received from Facebook'
        };
        
        return new Response(JSON.stringify(response), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      transactionStage = 'user_info';
      // Get user information
      const userInfo = await getUserInfo(tokenData.access_token);
      console.log('Facebook user info:', userInfo);

      transactionStage = 'ad_accounts';
      // Get ad accounts for the user
      const adAccountsData = await getAdAccounts(tokenData.access_token);
      console.log('Ad accounts fetched successfully');

      transactionStage = 'pages';
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

      try {
        transactionStage = 'database_save';
        rollbackNeeded = true;
        
        // Save the connection to the database with ad accounts and pages
        const saveResult = await saveConnectionToDatabase(
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

        if (saveResult && saveResult.data && saveResult.data[0]) {
          savedConnectionId = saveResult.data[0].id;
        }
        
        transactionStage = 'complete';
        rollbackNeeded = false;
        
        const response: FacebookOAuthResponse = {
          success: true,
          platform: 'facebook',
          accountId,
          accountName,
          adAccounts: adAccountsData?.data || [],
          pages: pagesData?.data || [],
          message: 'Successfully connected to Facebook Ads'
        };
        
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error saving connection:', error);
        
        // If we need to rollback and have a connection ID
        if (rollbackNeeded && savedConnectionId) {
          try {
            console.log(`Attempting to roll back connection creation: ${savedConnectionId}`);
            // Add rollback logic here if needed
          } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
          }
        }
        
        const response: FacebookOAuthResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred saving connection',
          details: { stage: 'database_save' }
        };
        
        return new Response(JSON.stringify(response), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error('Error in Facebook OAuth:', error);
      
      // If we need to rollback and have a connection ID
      if (rollbackNeeded && savedConnectionId) {
        try {
          console.log(`Attempting to roll back after error in stage ${transactionStage}`);
          // Add rollback logic here if needed
        } catch (rollbackError) {
          console.error('Error during rollback:', rollbackError);
        }
      }
      
      const response: FacebookOAuthResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        stage: transactionStage,
        stack: error instanceof Error ? error.stack : null
      };
      
      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error in Facebook OAuth:', error);
    
    const response: FacebookOAuthResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : null
    };
    
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
