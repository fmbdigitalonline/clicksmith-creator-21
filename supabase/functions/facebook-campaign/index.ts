
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// The Facebook Graph API version to use
const FACEBOOK_API_VERSION = "v19.0";

interface CreateCampaignRequest {
  accessToken: string;
  adAccountId: string;
  campaignName: string;
  objective: string;
  dailyBudget: number;
  startDate: string;
  endDate: string;
  targeting: any;
  adsetName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { url, method } = req;
    console.log(`facebook-campaign function called: ${method} ${url}`);

    if (method !== "POST") {
      throw new Error("Only POST requests are supported");
    }

    // Parse request body
    const body: CreateCampaignRequest = await req.json();
    const { accessToken, adAccountId, campaignName, objective, dailyBudget, startDate, endDate, targeting, adsetName } = body;

    // Validate required fields
    if (!accessToken) throw new Error("Access token is required");
    if (!adAccountId) throw new Error("Ad account ID is required");
    if (!campaignName) throw new Error("Campaign name is required");
    if (!objective) throw new Error("Campaign objective is required");
    if (!dailyBudget) throw new Error("Daily budget is required");
    if (!startDate) throw new Error("Start date is required");
    if (!targeting) throw new Error("Targeting information is required");

    console.log("Creating Facebook campaign");
    
    // Step 1: Create the campaign
    const campaignUrl = new URL(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/${adAccountId}/campaigns`);
    campaignUrl.searchParams.append("access_token", accessToken);

    const campaignResponse = await fetch(campaignUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: campaignName,
        objective: objective.toUpperCase(),
        status: "PAUSED", // Start as paused for safety
        special_ad_categories: []
      })
    });

    const campaignData = await campaignResponse.json();
    
    if (!campaignResponse.ok || !campaignData.id) {
      console.error("Error creating campaign:", campaignData);
      throw new Error(`Failed to create campaign: ${JSON.stringify(campaignData)}`);
    }

    const campaignId = campaignData.id;
    console.log("Campaign created with ID:", campaignId);

    // Step 2: Create an ad set within the campaign
    const adsetUrl = new URL(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/${adAccountId}/adsets`);
    adsetUrl.searchParams.append("access_token", accessToken);

    // Format dates as YYYY-MM-DD
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = endDate ? new Date(endDate).toISOString().split('T')[0] : '';

    // Convert daily budget to cents (Facebook requires budget in cents)
    const budgetInCents = Math.round(dailyBudget * 100);

    const adsetResponse = await fetch(adsetUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: adsetName || `${campaignName} Ad Set`,
        campaign_id: campaignId,
        daily_budget: budgetInCents,
        billing_event: "IMPRESSIONS",
        optimization_goal: "REACH",
        bid_amount: 200, // $2.00 bid amount in cents
        status: "PAUSED",
        targeting: targeting,
        start_time: formattedStartDate,
        end_time: formattedEndDate || null
      })
    });

    const adsetData = await adsetResponse.json();
    
    if (!adsetResponse.ok || !adsetData.id) {
      console.error("Error creating ad set:", adsetData);
      throw new Error(`Failed to create ad set: ${JSON.stringify(adsetData)}`);
    }

    const adsetId = adsetData.id;
    console.log("Ad set created with ID:", adsetId);

    // Return the campaign and ad set IDs
    return new Response(
      JSON.stringify({
        success: true,
        campaignId,
        adsetId,
        status: "PAUSED"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in facebook-campaign function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred during campaign creation",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
