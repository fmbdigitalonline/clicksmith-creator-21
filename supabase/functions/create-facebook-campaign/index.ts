
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID') || '';
const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Initialize Supabase admin client
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
        return fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
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

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

async function getPlatformConnection(userId: string, platform = 'facebook') {
  console.log(`Getting ${platform} connection for user:`, userId);
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/platform_connections?user_id=eq.${userId}&platform=eq.${platform}&select=*`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch connection: ${response.statusText}`);
    }

    const connections = await response.json();
    
    if (!connections || connections.length === 0) {
      console.log(`No ${platform} connection found for user:`, userId);
      return null;
    }
    
    console.log(`Found ${platform} connection:`, connections[0].id);
    return connections[0];
  } catch (error) {
    console.error(`Error getting ${platform} connection:`, error);
    throw error;
  }
}

async function createFacebookCampaign(accessToken: string, pageId: string, campaignData: any) {
  console.log('Creating Facebook campaign with page ID:', pageId);
  
  try {
    // 1. Create a Campaign
    const campaignResponse = await fetch(
      `https://graph.facebook.com/v18.0/act_${campaignData.adAccountId}/campaigns`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaignData.name,
          objective: campaignData.objective || 'OUTCOME_AWARENESS',
          status: 'PAUSED', // Start paused for safety
          special_ad_categories: [],
          access_token: accessToken,
        }),
      }
    );

    if (!campaignResponse.ok) {
      const errorText = await campaignResponse.text();
      throw new Error(`Campaign creation failed: ${errorText}`);
    }

    const campaign = await campaignResponse.json();
    console.log('Campaign created:', campaign.id);

    // 2. Create an Ad Set
    const adsetResponse = await fetch(
      `https://graph.facebook.com/v18.0/act_${campaignData.adAccountId}/adsets`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${campaignData.name} - Ad Set`,
          campaign_id: campaign.id,
          optimization_goal: 'REACH',
          billing_event: 'IMPRESSIONS',
          bid_amount: campaignData.bid || 500, // Bid amount in cents
          daily_budget: campaignData.budget * 100, // Budget in cents
          targeting: campaignData.targeting || {
            age_min: 18,
            age_max: 65,
            geo_locations: {
              countries: ['US']
            }
          },
          status: 'PAUSED',
          access_token: accessToken,
        }),
      }
    );

    if (!adsetResponse.ok) {
      const errorText = await adsetResponse.text();
      throw new Error(`Ad set creation failed: ${errorText}`);
    }

    const adset = await adsetResponse.json();
    console.log('Ad set created:', adset.id);

    // 3. Create Creative
    const creativeResponse = await fetch(
      `https://graph.facebook.com/v18.0/act_${campaignData.adAccountId}/adcreatives`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${campaignData.name} - Creative`,
          object_story_spec: {
            page_id: pageId,
            link_data: {
              message: campaignData.message || 'Check out our offer!',
              link: campaignData.link || 'https://example.com',
              name: campaignData.headline || 'Learn More',
              description: campaignData.description || 'Click to learn more about our products.',
              image_url: campaignData.imageUrl,
              call_to_action: {
                type: campaignData.callToAction || 'LEARN_MORE',
                value: {
                  link: campaignData.link || 'https://example.com',
                }
              }
            }
          },
          access_token: accessToken,
        }),
      }
    );

    if (!creativeResponse.ok) {
      const errorText = await creativeResponse.text();
      throw new Error(`Creative creation failed: ${errorText}`);
    }

    const creative = await creativeResponse.json();
    console.log('Creative created:', creative.id);

    // 4. Create Ad
    const adResponse = await fetch(
      `https://graph.facebook.com/v18.0/act_${campaignData.adAccountId}/ads`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${campaignData.name} - Ad`,
          adset_id: adset.id,
          creative: { creative_id: creative.id },
          status: 'PAUSED',
          access_token: accessToken,
        }),
      }
    );

    if (!adResponse.ok) {
      const errorText = await adResponse.text();
      throw new Error(`Ad creation failed: ${errorText}`);
    }

    const ad = await adResponse.json();
    console.log('Ad created:', ad.id);

    return {
      campaignId: campaign.id,
      adsetId: adset.id,
      creativeId: creative.id,
      adId: ad.id
    };
  } catch (error) {
    console.error('Error creating Facebook campaign:', error);
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
    console.log('Received request to create Facebook campaign');
    
    // Validate environment variables
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error('Missing required environment variables');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Server configuration error: Missing Facebook credentials'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Authorization header is required' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const authToken = authHeader.split(' ')[1];
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
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Campaign request data:', requestBody);
    } catch (e) {
      console.error('Error parsing JSON request body:', e);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid JSON in request body' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get Facebook connection for the user
    const connection = await getPlatformConnection(user.id, 'facebook');
    if (!connection) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No Facebook connection found for this user' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Check if metadata exists and extract page access token
    const metadata = connection.metadata || {};
    const selectedPageId = metadata.selectedPageId || (metadata.pages && metadata.pages.length > 0 ? metadata.pages[0].id : null);
    const pageAccessToken = metadata.pageAccessToken || (metadata.pages?.find(p => p.id === selectedPageId)?.access_token);
    
    if (!pageAccessToken) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No page access token found. Please reconnect your Facebook account and select a page.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Extract the numeric account ID from the full account ID
    let adAccountId = connection.account_id;
    if (adAccountId && adAccountId.startsWith('act_')) {
      adAccountId = adAccountId.substring(4);
    }
    
    // Prepare campaign data with the account ID
    const campaignData = {
      ...requestBody,
      adAccountId: adAccountId
    };
    
    // Create campaign
    const campaignResult = await createFacebookCampaign(
      pageAccessToken,
      selectedPageId,
      campaignData
    );
    
    // Save campaign to database
    const { data: dbCampaign, error: dbError } = await supabaseAdmin
      .from('ad_campaigns')
      .insert({
        user_id: user.id,
        project_id: requestBody.projectId || null,
        platform: 'facebook',
        name: requestBody.name,
        status: 'PAUSED',
        budget: requestBody.budget,
        start_date: requestBody.startDate || new Date().toISOString(),
        end_date: requestBody.endDate || null,
        targeting: requestBody.targeting || {},
        platform_campaign_id: campaignResult.campaignId
      });
    
    if (dbError) {
      console.error('Error saving campaign to database:', dbError);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Campaign created successfully',
      campaign: campaignResult,
      databaseRecord: dbCampaign || null
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in create-facebook-campaign:', error);
    
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
