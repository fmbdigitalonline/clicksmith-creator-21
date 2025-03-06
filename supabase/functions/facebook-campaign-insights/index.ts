
// Facebook Campaign Insights Edge Function
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestData {
  campaignId: string;
  dateFrom: string;
  dateTo: string;
  metrics?: string[];
}

// Define response structure
interface InsightsResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Helper for retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callWithRetry<T>(
  apiCall: () => Promise<T>, 
  retryCount = 0
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`API call failed, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      await delay(RETRY_DELAY_MS * Math.pow(2, retryCount));
      return callWithRetry(apiCall, retryCount + 1);
    }
    throw error;
  }
}

// Default metrics to fetch if none provided
const DEFAULT_METRICS = [
  'reach',
  'impressions',
  'clicks',
  'spend',
  'cpc',
  'ctr',
  'unique_clicks',
  'actions'
];

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
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
    const requestData: RequestData = await req.json();
    const { campaignId, dateFrom, dateTo, metrics = DEFAULT_METRICS } = requestData;

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: "Campaign ID is required" }),
        { status: 400, headers }
      );
    }

    // Get Facebook connection data for this user
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
          details: connectionError?.message
        }),
        { status: 400, headers }
      );
    }

    // Get access token and account ID
    const accessToken = connectionData.access_token;
    const adAccountId = connectionData.account_id;

    if (!accessToken || !adAccountId) {
      return new Response(
        JSON.stringify({ error: "Missing Facebook credentials" }),
        { status: 400, headers }
      );
    }

    // Fetch campaign details first to ensure it exists
    try {
      // Check if the campaign exists in our database
      const { data: campaignData, error: campaignError } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (campaignError || !campaignData) {
        return new Response(
          JSON.stringify({ error: "Campaign not found" }),
          { status: 404, headers }
        );
      }

      if (!campaignData.platform_campaign_id) {
        return new Response(
          JSON.stringify({ error: "Campaign has not been published to Facebook" }),
          { status: 400, headers }
        );
      }

      // Format date range
      const since = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default to 30 days ago
      const until = dateTo || new Date().toISOString().split('T')[0]; // Default to today

      // Prepare metrics for the API call
      const metricsParam = metrics.join(',');

      // Make API call to Facebook Marketing API to get insights
      const insightsData = await callWithRetry(async () => {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${campaignData.platform_campaign_id}/insights?fields=campaign_id,campaign_name,${metricsParam}&time_range={'since':'${since}','until':'${until}'}&level=campaign`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Facebook insights API error:", errorData);
          throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
        }

        return await response.json();
      });

      // Store latest insights in our database for caching
      await supabase
        .from("ad_campaigns")
        .update({
          insights_data: insightsData,
          insights_last_updated: new Date().toISOString()
        })
        .eq("id", campaignId);

      return new Response(
        JSON.stringify({
          success: true,
          data: insightsData,
          campaign: campaignData
        }),
        { status: 200, headers }
      );
    } catch (error) {
      console.error("Error fetching campaign insights:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || "Failed to fetch insights"
        }),
        { status: 500, headers }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred"
      }),
      { status: 500, headers }
    );
  }
});
