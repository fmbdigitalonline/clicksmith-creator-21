
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request body and operation type
    const { operation, campaignId, recordId, campaignData, adSetId } = await req.json();
    
    console.log(`Processing Facebook campaign operation: ${operation}`, { campaignId, recordId });

    if (!operation) {
      return new Response(
        JSON.stringify({ error: 'Missing operation parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Handle different operations
    switch (operation) {
      case 'create': {
        // Create campaign logic (from create-facebook-campaign)
        if (!campaignData) {
          return new Response(
            JSON.stringify({ error: 'Missing campaign data' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // In a real implementation, this would call the Facebook Marketing API
        // to create the campaign
        
        // Store the campaign in the database
        const { data, error } = await supabaseClient
          .from('ad_campaigns')
          .insert({
            campaign_data: campaignData,
            platform: 'facebook',
            status: 'active'
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error creating campaign:', error);
          throw error;
        }
        
        return new Response(
          JSON.stringify({ success: true, campaign: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'delete': {
        // Delete campaign logic (from delete-facebook-campaign)
        if (!recordId) {
          return new Response(
            JSON.stringify({ error: 'Missing recordId parameter' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        // In a real implementation, this would call the Facebook Marketing API
        // to delete the campaign if needed
        
        // Delete the campaign from the database
        const { error } = await supabaseClient
          .from('ad_campaigns')
          .delete()
          .eq('id', recordId);
        
        if (error) {
          console.error('Error deleting campaign:', error);
          throw error;
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'activate': {
        // Activate campaign logic (from activate-facebook-campaign)
        if (!recordId) {
          return new Response(
            JSON.stringify({ error: 'Missing recordId parameter' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        // In a real implementation, this would call the Facebook Marketing API
        // to activate the campaign
        
        // Update the campaign status in the database
        const { error } = await supabaseClient
          .from('ad_campaigns')
          .update({ status: 'active' })
          .eq('id', recordId);
        
        if (error) {
          console.error('Error activating campaign:', error);
          throw error;
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'deactivate': {
        // Deactivate campaign logic (from deactivate-facebook-campaign)
        if (!recordId) {
          return new Response(
            JSON.stringify({ error: 'Missing recordId parameter' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        // In a real implementation, this would call the Facebook Marketing API
        // to pause/deactivate the campaign
        
        // Update the campaign status in the database
        const { error } = await supabaseClient
          .from('ad_campaigns')
          .update({ status: 'paused' })
          .eq('id', recordId);
        
        if (error) {
          console.error('Error deactivating campaign:', error);
          throw error;
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'get_campaign_details': {
        // Get campaign details logic
        if (!recordId) {
          return new Response(
            JSON.stringify({ error: 'Missing recordId parameter' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        // Fetch campaign details from database
        const { data, error } = await supabaseClient
          .from('ad_campaigns')
          .select('*')
          .eq('id', recordId)
          .maybeSingle();
        
        if (error) {
          console.error('Error getting campaign details:', error);
          throw error;
        }
        
        return new Response(
          JSON.stringify({ success: true, campaign: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'verify_connection': {
        // Verify that user has an active Facebook connection
        const { userId } = await req.json();
        
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing userId parameter' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        const { data, error } = await supabaseClient
          .from('platform_connections')
          .select('*')
          .eq('platform', 'facebook')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (error) {
          console.error('Error verifying connection:', error);
          throw error;
        }
        
        // Check if token is expired
        let isValid = false;
        let message = 'No Facebook connection found';
        
        if (data) {
          if (data.token_expires_at) {
            const expiryDate = new Date(data.token_expires_at);
            if (expiryDate > new Date()) {
              isValid = true;
              message = 'Connection valid';
            } else {
              message = 'Connection token expired';
            }
          } else {
            // If no expiry date, assume it's valid
            isValid = true;
            message = 'Connection valid (no expiry date)';
          }
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            isValid,
            message,
            connection: data
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      default:
        return new Response(
          JSON.stringify({ error: `Unknown operation: ${operation}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing Facebook campaign operation:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
