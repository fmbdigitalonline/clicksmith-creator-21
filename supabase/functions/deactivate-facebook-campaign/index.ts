
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

    // Get request body
    const { campaignId, adSetId, recordId } = await req.json();
    
    console.log(`Deactivating campaign: ${campaignId}, adSet: ${adSetId}, record: ${recordId}`);

    if (!campaignId || !adSetId || !recordId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // In a real implementation, this would call the Facebook Marketing API
    // to deactivate the campaign and ad set
    
    // Simulate a brief delay for the API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update the campaign status in the database
    const { data, error } = await supabaseClient
      .from('ad_campaigns')
      .update({ status: 'paused' })
      .eq('id', recordId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating campaign status:', error);
      throw error;
    }
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deactivating campaign:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
