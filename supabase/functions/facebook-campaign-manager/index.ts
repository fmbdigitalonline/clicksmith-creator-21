import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from "../_shared/cors.ts";
import { FacebookAPI } from "./facebook-api.ts";
import { createCampaign } from "./handlers/create-campaign.ts";
import { getCampaigns } from "./handlers/get-campaigns.ts";
import { getCampaign } from "./handlers/get-campaign.ts";
import { updateCampaign } from "./handlers/update-campaign.ts";
import { deleteCampaign } from "./handlers/delete-campaign.ts";
import { syncCampaigns } from "./handlers/sync-campaigns.ts";
import { getAdAccounts } from "./handlers/get-ad-accounts.ts";
import { getAdAccount } from "./handlers/get-ad-account.ts";
import { checkConnection } from "./handlers/check-connection.ts";
import { getInsights } from "./handlers/get-insights.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { operation, ...data } = await req.json();
    
    // Get the user's ID from the JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify the JWT and get the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authorization token');
    }
    
    // Get the user's Facebook credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from('facebook_credentials')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (credentialsError && credentialsError.code !== 'PGRST116') {
      throw new Error(`Error fetching Facebook credentials: ${credentialsError.message}`);
    }
    
    // Initialize Facebook API with user's credentials if available
    const fbApi = credentials ? new FacebookAPI(credentials.access_token, credentials.ad_account_id) : null;
    
    // Process the operation
    let result;
    
    switch (operation) {
      case 'check_connection':
        result = await checkConnection(fbApi, supabase, user.id);
        break;
        
      case 'get_ad_accounts':
        result = await getAdAccounts(fbApi, supabase, user.id);
        break;
        
      case 'get_ad_account':
        result = await getAdAccount(fbApi, supabase, user.id, data.ad_account_id);
        break;
        
      case 'create_campaign':
        // Ensure we're using the processed image URLs
        if (data.campaign_data?.ad_details) {
          data.campaign_data.ad_details = data.campaign_data.ad_details.map(ad => ({
            ...ad,
            // Prioritize storage_url over other image URLs
            imageUrl: ad.storage_url || ad.imageUrl || ad.imageurl
          }));
        }
        result = await createCampaign(fbApi, supabase, user.id, data.campaign_data);
        break;
        
      case 'get_campaigns':
        result = await getCampaigns(fbApi, supabase, user.id, data.filters);
        break;
        
      case 'get_campaign':
        result = await getCampaign(fbApi, supabase, user.id, data.campaign_id);
        break;
        
      case 'update_campaign':
        result = await updateCampaign(fbApi, supabase, user.id, data.campaign_id, data.campaign_data);
        break;
        
      case 'delete_campaign':
        result = await deleteCampaign(fbApi, supabase, user.id, data.campaign_id);
        break;
        
      case 'sync_campaigns':
        result = await syncCampaigns(fbApi, supabase, user.id);
        break;
        
      case 'get_insights':
        result = await getInsights(fbApi, supabase, user.id, data.campaign_id, data.time_range);
        break;
        
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Error in facebook-campaign-manager:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack || 'No stack trace available'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
