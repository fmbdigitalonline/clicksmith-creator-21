
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Maximum number of retry attempts for API calls
const MAX_RETRIES = 3;
// Delay between retries in milliseconds (starting with 1s)
const RETRY_DELAY_MS = 1000;

/**
 * Utility function to delay execution
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Makes API call with retry logic
 */
async function callWithRetry<T>(
  apiCall: () => Promise<T>, 
  retryCount = 0
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`API call failed, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      // Exponential backoff
      await delay(RETRY_DELAY_MS * Math.pow(2, retryCount));
      return callWithRetry(apiCall, retryCount + 1);
    }
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Setup headers for response
  const headers = {
    "Content-Type": "application/json",
    ...corsHeaders
  };

  try {
    // Validate the request method
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers }
      );
    }

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers }
      );
    }

    // Setup Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT token from request
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication token" }),
        { status: 401, headers }
      );
    }

    // Parse request data
    const { campaignId, adSetId, recordId } = await req.json();

    if (!campaignId || !adSetId) {
      return new Response(
        JSON.stringify({ error: "Missing campaign or ad set ID" }),
        { status: 400, headers }
      );
    }

    // Get Facebook connection data
    const { data: connectionData, error: connectionError } = await supabase
      .from("platform_connections")
      .select("*")
      .eq("platform", "facebook")
      .eq("user_id", user.id)
      .single();

    if (connectionError || !connectionData) {
      return new Response(
        JSON.stringify({ 
          error: "Facebook account not connected",
          status: "auth_error",
          statusDetails: "Please reconnect your Facebook account" 
        }),
        { status: 400, headers }
      );
    }

    // Get Facebook access token and account ID
    const accessToken = connectionData.access_token;
    const adAccountId = connectionData.account_id;

    if (!accessToken || !adAccountId) {
      return new Response(
        JSON.stringify({ 
          error: "Missing Facebook credentials",
          status: "auth_error",
          statusDetails: "Facebook access token or ad account ID is missing" 
        }),
        { status: 400, headers }
      );
    }

    // Activate the campaign and ad set
    console.log("Activating Facebook campaign...");
    try {
      // 1. Update campaign status to ACTIVE
      const campaignResponse = await callWithRetry(async () => {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${campaignId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              status: "ACTIVE",
            }),
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Facebook campaign activation error:", errorData);
          throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
        }
        
        return await response.json();
      });
      
      // 2. Update ad set status to ACTIVE
      const adSetResponse = await callWithRetry(async () => {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${adSetId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              status: "ACTIVE",
            }),
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Facebook ad set activation error:", errorData);
          throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
        }
        
        return await response.json();
      });

      // Update activation status in database if recordId is provided
      if (recordId) {
        await supabase
          .from("ad_campaigns")
          .update({ 
            status: "active",
            campaign_data: {
              is_activated: true,
              activation_date: new Date().toISOString()
            }
          })
          .eq("id", recordId);
      }
      
      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          message: "Campaign activated successfully",
          campaignResult: campaignResponse,
          adSetResult: adSetResponse
        }),
        { status: 200, headers }
      );
      
    } catch (error) {
      console.error("Error activating Facebook campaign:", error);
      
      return new Response(
        JSON.stringify({ 
          error: error.message || "Unknown error", 
          success: false,
          status: "api_error",
          statusDetails: "Error occurred during Facebook API calls"
        }),
        { status: 500, headers }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error", 
        success: false,
        status: "server_error",
        statusDetails: "An unexpected error occurred"
      }),
      { status: 500, headers }
    );
  }
});
