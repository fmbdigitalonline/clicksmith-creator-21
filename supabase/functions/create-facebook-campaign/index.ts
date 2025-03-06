
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID') || Deno.env.get('VITE_FACEBOOK_APP_ID') || '';
const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create Supabase client for admin operations
const createClient = (supabaseUrl: string, supabaseKey: string) => {
  return {
    from: (table: string) => ({
      insert: (data: any) => {
        return fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation'
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
      },
      select: (query: string) => {
        return fetch(`${supabaseUrl}/rest/v1/${table}?select=${query}`, {
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
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
        try {
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
        } catch (error) {
          console.error('Error in getUser:', error);
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

async function createFacebookCampaign(accessToken: string, adAccountId: string, campaignData: any) {
  console.log('Creating Facebook campaign with data:', { adAccountId, campaignData });
  
  // Check that we have all required fields
  if (!campaignData.name || !campaignData.objective) {
    throw new Error('Campaign name and objective are required');
  }

  try {
    // 1. Create Campaign
    const campaignResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/campaigns`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaignData.name,
          objective: campaignData.objective || 'OUTCOME_AWARENESS',
          status: campaignData.status || 'PAUSED',
          special_ad_categories: [],
          access_token: accessToken
        }),
      }
    );

    if (!campaignResponse.ok) {
      const errorText = await campaignResponse.text();
      console.error('Error creating campaign:', errorText);
      throw new Error(`Failed to create campaign: ${errorText}`);
    }

    const campaignResult = await campaignResponse.json();
    console.log('Campaign created:', campaignResult);

    // 2. Create Ad Set
    const adSetResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/adsets`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaignData.adSetName || `${campaignData.name} Ad Set`,
          campaign_id: campaignResult.id,
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'REACH',
          bid_amount: campaignData.bidAmount || 2000, // Bid amount in cents
          targeting: campaignData.targeting || {
            age_min: 18,
            age_max: 65,
            genders: [1, 2], // 1 = male, 2 = female
            geo_locations: {
              countries: ['US'],
            },
          },
          status: campaignData.status || 'PAUSED',
          daily_budget: campaignData.dailyBudget || 1000, // Budget in cents (e.g., $10.00)
          access_token: accessToken
        }),
      }
    );

    if (!adSetResponse.ok) {
      const errorText = await adSetResponse.text();
      console.error('Error creating ad set:', errorText);
      throw new Error(`Failed to create ad set: ${errorText}`);
    }

    const adSetResult = await adSetResponse.json();
    console.log('Ad Set created:', adSetResult);

    // 3. Create Ad
    const adResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/ads`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaignData.adName || `${campaignData.name} Ad`,
          adset_id: adSetResult.id,
          status: campaignData.status || 'PAUSED',
          creative: campaignData.creative || {
            title: campaignData.headline || "Default Headline",
            body: campaignData.description || "Default description for the ad.",
            object_story_spec: {
              page_id: campaignData.pageId,
              link_data: {
                message: campaignData.description || "Default message",
                link: campaignData.link || "https://example.com",
                image_hash: campaignData.imageHash,
                name: campaignData.headline || "Default Headline",
                call_to_action: {
                  type: "LEARN_MORE"
                }
              }
            }
          },
          access_token: accessToken
        }),
      }
    );

    if (!adResponse.ok) {
      const errorText = await adResponse.text();
      console.error('Error creating ad:', errorText);
      throw new Error(`Failed to create ad: ${errorText}`);
    }

    const adResult = await adResponse.json();
    console.log('Ad created:', adResult);

    // Return combined results
    return {
      campaignId: campaignResult.id,
      adSetId: adSetResult.id,
      adId: adResult.id,
    };
  } catch (error) {
    console.error('Error in createFacebookCampaign:', error);
    throw error;
  }
}

async function getAdAccountDetails(accessToken: string, adAccountId: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}?fields=name,account_status,amount_spent,balance,currency,funding_source_details&access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching ad account details:', errorText);
      throw new Error(`Failed to fetch ad account details: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getAdAccountDetails:', error);
    throw error;
  }
}

async function fetchAccountCampaigns(accessToken: string, adAccountId: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/campaigns?fields=name,objective,status,created_time,budget_remaining&access_token=${accessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching campaigns:', errorText);
      throw new Error(`Failed to fetch campaigns: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in fetchAccountCampaigns:', error);
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
    
    // Process the request
    const contentType = req.headers.get('content-type') || '';
    let requestBody = {};
    
    if (contentType.includes('application/json')) {
      try {
        requestBody = await req.json();
        console.log('Request body:', requestBody);
      } catch (e) {
        console.error('Error parsing JSON request body:', e);
      }
    }
    
    // Get auth token from request headers
    const authToken = req.headers.get('Authorization')?.split(' ')[1];
    
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

    // Get action from request
    const { action, adAccountId, campaignData } = requestBody;

    if (!action) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Action is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get Facebook connection
    const { data: connections, error: connectionError } = await supabaseAdmin
      .from('platform_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'facebook');

    if (connectionError || !connections || connections.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Facebook connection not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const connection = connections[0];
    const accessToken = connection.access_token;

    if (!accessToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Facebook access token not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let responseData;
    
    // Handle different actions
    switch (action) {
      case 'get_ad_accounts':
        // Return ad accounts from the connection metadata
        responseData = {
          success: true,
          adAccounts: connection.metadata?.adAccounts || []
        };
        break;
        
      case 'get_ad_account_details':
        if (!adAccountId) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Ad account ID is required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Get ad account details
        const accountDetails = await getAdAccountDetails(accessToken, adAccountId);
        responseData = {
          success: true,
          accountDetails
        };
        break;
        
      case 'get_campaigns':
        if (!adAccountId) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Ad account ID is required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Get campaigns for the ad account
        const campaigns = await fetchAccountCampaigns(accessToken, adAccountId);
        responseData = {
          success: true,
          campaigns: campaigns.data || []
        };
        break;
        
      case 'create_campaign':
        if (!adAccountId) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Ad account ID is required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        if (!campaignData) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Campaign data is required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Create campaign
        const campaignResult = await createFacebookCampaign(accessToken, adAccountId, campaignData);
        
        // Save campaign to database
        const { data: dbCampaign, error: dbError } = await supabaseAdmin
          .from('ad_campaigns')
          .insert({
            user_id: user.id,
            platform: 'facebook',
            status: campaignData.status || 'PAUSED',
            platform_campaign_id: campaignResult.campaignId,
            platform_ad_set_id: campaignResult.adSetId,
            platform_ad_id: campaignResult.adId,
            campaign_data: campaignData
          });
          
        if (dbError) {
          console.error('Error saving campaign to database:', dbError);
        }
        
        responseData = {
          success: true,
          campaignId: campaignResult.campaignId,
          adSetId: campaignResult.adSetId,
          adId: campaignResult.adId,
          message: 'Campaign created successfully'
        };
        break;
        
      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unsupported action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in Facebook Campaign function:', error);
    
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
