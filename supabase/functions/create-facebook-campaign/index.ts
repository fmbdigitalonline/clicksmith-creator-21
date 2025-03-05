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
  status?: string;
  statusDetails?: string;
  validationErrors?: string[];
}

// Maximum number of retry attempts for API calls
const MAX_RETRIES = 3;
// Delay between retries in milliseconds (starting with 1s)
const RETRY_DELAY_MS = 1000;

/**
 * Utility function to delay execution
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validates campaign data before submission
 */
const validateCampaignData = (campaignData: any, adSetData: any, adCreativeData: any): string[] => {
  const errors: string[] = [];
  
  // Campaign validation
  if (!campaignData) {
    errors.push("Campaign data is missing");
  } else {
    if (!campaignData.name) errors.push("Campaign name is required");
    if (!campaignData.objective) errors.push("Campaign objective is required");
  }
  
  // Ad Set validation
  if (!adSetData) {
    errors.push("Ad Set data is missing");
  } else {
    if (!adSetData.name) errors.push("Ad Set name is required");
    if (!adSetData.daily_budget) errors.push("Ad Set budget is required");
    if (!adSetData.targeting) errors.push("Ad Set targeting is required");
  }
  
  // Ad Creative validation
  if (!adCreativeData) {
    errors.push("Ad Creative data is missing");
  } else {
    if (!adCreativeData.object_story_spec) errors.push("Ad Creative story spec is missing");
  }
  
  return errors;
};

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

    // Validate data before proceeding
    const validationErrors = validateCampaignData(campaignData, adSetData, adCreativeData);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: "Validation failed", 
          success: false, 
          validationErrors,
          status: "validation_error",
          statusDetails: "The campaign data failed validation checks"
        }),
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

    // Create a campaign record in a "pending" state so we can track status
    const campaignName = campaignData.name || `Facebook Campaign ${new Date().toISOString().split('T')[0]}`;
    const { data: initialCampaign, error: initialSaveError } = await supabase
      .from("ad_campaigns")
      .insert({
        name: campaignName,
        platform: "facebook",
        status: "pending", 
        project_id: projectId,
        // Store campaign data in the targeting field which is JSONB
        targeting: {
          campaign: campaignData,
          adSet: adSetData,
          adCreative: adCreativeData
        },
        image_url: adCreativeData.object_story_spec?.link_data?.image_url
      })
      .select()
      .single();

    if (initialSaveError) {
      console.error("Error creating initial campaign record:", initialSaveError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to initialize campaign tracking",
          status: "db_error",
          statusDetails: "Database error occurred"
        }),
        { status: 500, headers }
      );
    }

    // In a real implementation, we would now create the campaign, ad set, and ad
    // using the Facebook Marketing API
    // For demonstration, we'll mock the API response
    
    // This is a simplified mockup - in a real implementation, you would call the 
    // Facebook Marketing API to create the campaign, ad set, and ad with retry logic
    // Here's what it would look like:

    /*
    // 1. Create Campaign with retry
    let campaignResult: FacebookApiResponse;
    try {
      campaignResult = await callWithRetry(async () => {
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
        
        if (!campaignResponse.ok) {
          const errorData = await campaignResponse.json();
          throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
        }
        
        return await campaignResponse.json();
      });
      
      if (!campaignResult.id) {
        throw new Error("Failed to create campaign, no ID returned");
      }
      
      // Update campaign status
      await supabase
        .from("ad_campaigns")
        .update({ status: "campaign_created" })
        .eq("id", initialCampaign.id);
    } catch (error) {
      console.error("Campaign creation error:", error);
      
      // Update campaign status to error
      await supabase
        .from("ad_campaigns")
        .update({ 
          status: "error",
          campaign_data: { ...campaignData, error_message: error.message }
        })
        .eq("id", initialCampaign.id);
        
      throw error;
    }

    // 2. Create Ad Set with retry
    let adSetResult: FacebookApiResponse;
    try {
      adSetResult = await callWithRetry(async () => {
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
        
        if (!adSetResponse.ok) {
          const errorData = await adSetResponse.json();
          throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
        }
        
        return await adSetResponse.json();
      });
      
      if (!adSetResult.id) {
        throw new Error("Failed to create ad set, no ID returned");
      }
      
      // Update campaign status
      await supabase
        .from("ad_campaigns")
        .update({ 
          status: "adset_created",
          platform_ad_set_id: adSetResult.id
        })
        .eq("id", initialCampaign.id);
    } catch (error) {
      console.error("Ad set creation error:", error);
      
      // Update campaign status to error
      await supabase
        .from("ad_campaigns")
        .update({ 
          status: "error",
          campaign_data: { 
            ...campaignData, 
            error_message: `Ad set creation failed: ${error.message}`,
            campaign_id: campaignResult.id
          }
        })
        .eq("id", initialCampaign.id);
        
      throw error;
    }
    */

    // Mock response for demonstration
    // In real-world, we'd complete the implementation of the ad creation process
    await delay(1500); // Simulate API delay
    
    const response: CampaignResponse = {
      campaignId: `mock_campaign_${Date.now()}`,
      adSetId: `mock_adset_${Date.now()}`,
      adId: `mock_ad_${Date.now()}`,
      success: true,
      status: "completed",
      statusDetails: "Campaign created successfully and is in PAUSED state"
    };

    // Log the successful campaign creation (for debugging)
    console.log("Campaign created successfully:", response);

    // Save to ad_campaigns table with proper schema
    const { data: campaignRecord, error: saveError } = await supabase
      .from("ad_campaigns")
      .update({
        name: campaignName,
        platform: "facebook",
        status: "draft", 
        platform_campaign_id: response.campaignId,
        // Use targeting JSONB field for storing detailed campaign data
        targeting: {
          campaign: campaignData,
          adSet: adSetData,
          adCreative: adCreativeData,
          platform_ad_set_id: response.adSetId,
          platform_ad_id: response.adId,
          error_message: null
        }
      })
      .eq("id", initialCampaign.id)
      .select()
      .single();

    if (saveError) {
      console.error("Error saving campaign:", saveError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to save campaign data", 
          success: false,
          campaignId: response.campaignId,
          status: "db_error",
          statusDetails: "Campaign was created but failed to update in database"
        }),
        { status: 500, headers }
      );
    }

    // Return the response with campaign record ID
    return new Response(
      JSON.stringify({
        ...response,
        campaignRecordId: campaignRecord.id
      }), 
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Error creating Facebook campaign:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error", 
        success: false,
        status: "server_error",
        statusDetails: "An unexpected error occurred during campaign creation"
      }),
      { status: 500, headers }
    );
  }
});
