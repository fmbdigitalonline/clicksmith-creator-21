import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RequestData {
  campaignData: any;
  adSetData: any;
  adCreativeData: any;
  projectId: string;
}

interface FacebookApiResponse {
  id: string;
  success: boolean;
}

interface CampaignResponse {
  campaignId?: string;
  adSetId?: string;
  adId?: string;
  error?: string;
  success: boolean;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Setup headers for response
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    const { campaignData, adSetData, adCreativeData, projectId } = requestData;

    if (!campaignData || !adSetData || !adCreativeData || !projectId) {
      return new Response(
        JSON.stringify({ error: "Missing required data" }),
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
        JSON.stringify({ error: "Facebook account not connected" }),
        { status: 400, headers }
      );
    }

    // Get Facebook access token and account ID
    const accessToken = connectionData.access_token;
    const adAccountId = connectionData.account_id;

    if (!accessToken || !adAccountId) {
      return new Response(
        JSON.stringify({ error: "Missing Facebook credentials" }),
        { status: 400, headers }
      );
    }

    // In a real implementation, we would now create the campaign, ad set, and ad
    // using the Facebook Marketing API
    // For demonstration, we'll mock the API response
    
    // This is a simplified mockup - in a real implementation, you would call the 
    // Facebook Marketing API to create the campaign, ad set, and ad
    // Here's what it would look like:

    /*
    // 1. Create Campaign
    const campaignResponse = await fetch(
      `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: campaignData.name,
          objective: campaignData.objective,
          status: campaignData.status || "PAUSED",
          special_ad_categories: campaignData.special_ad_categories || [],
        }),
      }
    );

    const campaignResult: FacebookApiResponse = await campaignResponse.json();
    if (!campaignResult.id) {
      throw new Error("Failed to create campaign");
    }

    // 2. Create Ad Set
    const adSetResponse = await fetch(
      `https://graph.facebook.com/v18.0/act_${adAccountId}/adsets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: adSetData.name,
          campaign_id: campaignResult.id,
          daily_budget: adSetData.daily_budget,
          bid_amount: adSetData.bid_amount,
          billing_event: adSetData.billing_event,
          optimization_goal: adSetData.optimization_goal,
          targeting: adSetData.targeting,
          status: adSetData.status || "PAUSED",
        }),
      }
    );

    const adSetResult: FacebookApiResponse = await adSetResponse.json();
    if (!adSetResult.id) {
      throw new Error("Failed to create ad set");
    }

    // 3. Create Ad Creative
    const creativeResponse = await fetch(
      `https://graph.facebook.com/v18.0/act_${adAccountId}/adcreatives`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: adCreativeData.name,
          object_story_spec: {
            page_id: connectionData.page_id, // Use the user's Facebook Page ID
            link_data: adCreativeData.object_story_spec.link_data,
          },
        }),
      }
    );

    const creativeResult: FacebookApiResponse = await creativeResponse.json();
    if (!creativeResult.id) {
      throw new Error("Failed to create ad creative");
    }

    // 4. Create Ad
    const adResponse = await fetch(
      `https://graph.facebook.com/v18.0/act_${adAccountId}/ads`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: `Ad for ${adSetData.name}`,
          adset_id: adSetResult.id,
          creative: { creative_id: creativeResult.id },
          status: "PAUSED",
        }),
      }
    );

    const adResult: FacebookApiResponse = await adResponse.json();
    */

    // Mock response for demonstration
    const response: CampaignResponse = {
      campaignId: `mock_campaign_${Date.now()}`,
      adSetId: `mock_adset_${Date.now()}`,
      adId: `mock_ad_${Date.now()}`,
      success: true,
    };

    // Log the successful campaign creation (for debugging)
    console.log("Campaign created successfully:", response);

    // Save to ad_campaigns table
    const { data: campaignRecord, error: saveError } = await supabase
      .from("ad_campaigns")
      .insert({
        name: campaignData.name || `Facebook Campaign ${new Date().toISOString().split('T')[0]}`,
        platform: "facebook",
        status: "draft", 
        platform_campaign_id: response.campaignId,
        campaign_data: campaignData,
        project_id: projectId,
        image_url: adCreativeData.object_story_spec?.link_data?.image_url
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving campaign:", saveError);
    }

    // Return the response
    return new Response(JSON.stringify(response), { status: 200, headers });
  } catch (error) {
    console.error("Error creating Facebook campaign:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error", success: false }),
      { status: 500, headers }
    );
  }
});
