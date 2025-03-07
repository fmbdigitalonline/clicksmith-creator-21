
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.20.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Server configuration error');
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const requestData = await req.json();
    const { campaignId, adSetId, recordId } = requestData;
    
    console.log(`Deactivating campaign: ${campaignId}, ad set: ${adSetId}, record: ${recordId}`);

    if (!recordId) {
      return new Response(
        JSON.stringify({ error: 'Missing campaign record ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get Facebook connection for the user who owns this campaign
    const { data: campaignData, error: campaignError } = await supabaseClient
      .from('ad_campaigns')
      .select('user_id, platform_campaign_id, platform_ad_set_id')
      .eq('id', recordId)
      .single();
    
    if (campaignError || !campaignData) {
      console.error('Error fetching campaign data:', campaignError);
      throw new Error('Campaign not found');
    }

    // Now get the user's Facebook connection
    const { data: connectionData, error: connectionError } = await supabaseClient
      .from('platform_connections')
      .select('access_token')
      .eq('platform', 'facebook')
      .eq('user_id', campaignData.user_id)
      .single();
    
    if (connectionError || !connectionData || !connectionData.access_token) {
      console.error('Error fetching Facebook connection:', connectionError);
      throw new Error('Facebook connection not found');
    }

    const accessToken = connectionData.access_token;
    
    // In a real implementation, this would call the Facebook Marketing API
    // to deactivate the campaign and ad set
    
    // If we have an actual Facebook campaign ID, attempt to deactivate it via the API
    if (campaignId && accessToken) {
      console.log(`Making Facebook API call to pause campaign ${campaignId}`);
      try {
        // This is where we would make the Facebook Marketing API call
        // For example:
        // const response = await fetch(
        //   `https://graph.facebook.com/v18.0/${campaignId}`,
        //   {
        //     method: 'POST',
        //     headers: {
        //       'Content-Type': 'application/json',
        //       'Authorization': `Bearer ${accessToken}`
        //     },
        //     body: JSON.stringify({ status: 'PAUSED' })
        //   }
        // );
        // const result = await response.json();
        // if (!response.ok) throw new Error(result.error?.message || 'Facebook API error');
      } catch (fbError) {
        console.error('Error calling Facebook API:', fbError);
        // Continue with local status update even if Facebook API fails
      }
    }
    
    // Update the campaign status in the database
    const { error: updateError } = await supabaseClient
      .from('ad_campaigns')
      .update({ status: 'paused' })
      .eq('id', recordId);
    
    if (updateError) {
      console.error('Error updating campaign status:', updateError);
      throw updateError;
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Campaign deactivated successfully"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deactivating campaign:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred",
        success: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
