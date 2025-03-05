
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1];
    
    if (!token) {
      throw new Error('Missing authentication token');
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }
    
    // Parse request body
    const { campaignId } = await req.json();
    
    if (!campaignId) {
      throw new Error('Campaign ID is required');
    }
    
    // Get Facebook access token
    const { data: connection, error: connectionError } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'facebook')
      .maybeSingle();
    
    if (connectionError) {
      throw connectionError;
    }
    
    if (!connection || !connection.access_token) {
      throw new Error('No Facebook connection found');
    }
    
    const accessToken = connection.access_token;
    
    // Fetch campaign data from Facebook
    console.log(`Fetching data for campaign ID: ${campaignId}`);
    const campaignResponse = await fetch(
      `https://graph.facebook.com/v16.0/${campaignId}?fields=name,status,objective,spend,insights{impressions,clicks,ctr,cpm}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!campaignResponse.ok) {
      const errorText = await campaignResponse.text();
      console.error("Facebook API error:", errorText);
      throw new Error(`Failed to fetch campaign data: ${errorText}`);
    }
    
    const campaignData = await campaignResponse.json();
    
    // Update campaign in database
    const { data: updatedCampaign, error: updateError } = await supabase
      .from('ad_campaigns')
      .update({
        status: campaignData.status,
        updated_at: new Date().toISOString(),
        facebook_data: campaignData
      })
      .eq('platform_campaign_id', campaignId)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating campaign in database:", updateError);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        campaign: updatedCampaign || campaignData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in facebook-campaign-status function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
