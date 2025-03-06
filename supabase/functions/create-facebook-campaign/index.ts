
// This file implements the Facebook campaign creation edge function

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

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

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
        user_id: user.id,
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
    
    // Now make the actual API calls to Facebook Marketing API
    let campaignResult: FacebookApiResponse;
    let adSetResult: FacebookApiResponse;
    let adResult: FacebookApiResponse;
    
    try {
      // 1. Create Campaign with retry
      console.log("Creating Facebook campaign...");
      campaignResult = await callWithRetry(async () => {
        const campaignResponse = await fetch(
          `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
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
          console.error("Facebook campaign creation API error:", errorData);
          throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
        }
        
        const data = await campaignResponse.json();
        console.log("Campaign created successfully:", data);
        return { id: data.id, success: true };
      });
      
      if (!campaignResult.id) {
        throw new Error("Failed to create campaign, no ID returned");
      }
      
      // Update campaign status
      await supabase
        .from("ad_campaigns")
        .update({ 
          status: "campaign_created",
          platform_campaign_id: campaignResult.id
        })
        .eq("id", initialCampaign.id);
      
      // 2. Create Ad Set with retry
      console.log("Creating Facebook ad set...");
      adSetResult = await callWithRetry(async () => {
        // Ensure daily_budget is in cents (Facebook requires this)
        const budget = typeof adSetData.daily_budget === 'number' 
          ? adSetData.daily_budget * 100 // Convert dollars to cents if it's a number
          : adSetData.daily_budget; // Otherwise keep as is (already in cents)
        
        const adSetResponse = await fetch(
          `https://graph.facebook.com/v18.0/act_${adAccountId}/adsets`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              name: adSetData.name,
              campaign_id: campaignResult.id,
              daily_budget: budget,
              bid_amount: adSetData.bid_amount,
              billing_event: adSetData.billing_event || 'IMPRESSIONS',
              optimization_goal: adSetData.optimization_goal || 'REACH',
              targeting: adSetData.targeting,
              status: adSetData.status || "PAUSED",
            }),
          }
        );
        
        if (!adSetResponse.ok) {
          const errorData = await adSetResponse.json();
          console.error("Facebook ad set creation API error:", errorData);
          throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
        }
        
        const data = await adSetResponse.json();
        console.log("Ad Set created successfully:", data);
        return { id: data.id, success: true };
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
      
      // 3. Create Ad Creative with retry
      console.log("Creating Facebook ad creative...");
      let creativeResult: FacebookApiResponse;
      
      creativeResult = await callWithRetry(async () => {
        // If the creative has a page_id placeholder, replace it with the actual page ID
        if (adCreativeData.object_story_spec.page_id === '{{page_id}}') {
          // Get the user's Facebook pages from the connection data
          const metadata = connectionData.metadata || {};
          const pages = metadata.pages || [];
          const pageId = pages.length > 0 ? pages[0].id : null;
          
          if (!pageId) {
            throw new Error("No Facebook page ID available");
          }
          
          adCreativeData.object_story_spec.page_id = pageId;
        }
        
        const creativeResponse = await fetch(
          `https://graph.facebook.com/v18.0/act_${adAccountId}/adcreatives`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify(adCreativeData),
          }
        );
        
        if (!creativeResponse.ok) {
          const errorData = await creativeResponse.json();
          console.error("Facebook ad creative creation API error:", errorData);
          throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
        }
        
        const data = await creativeResponse.json();
        console.log("Ad Creative created successfully:", data);
        return { id: data.id, success: true };
      });
      
      // 4. Create Ad with retry
      console.log("Creating Facebook ad...");
      adResult = await callWithRetry(async () => {
        const adResponse = await fetch(
          `https://graph.facebook.com/v18.0/act_${adAccountId}/ads`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              name: `Ad for ${campaignData.name}`,
              adset_id: adSetResult.id,
              creative: { creative_id: creativeResult.id },
              status: "PAUSED"
            }),
          }
        );
        
        if (!adResponse.ok) {
          const errorData = await adResponse.json();
          console.error("Facebook ad creation API error:", errorData);
          throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
        }
        
        const data = await adResponse.json();
        console.log("Ad created successfully:", data);
        return { id: data.id, success: true };
      });
      
      // Update campaign record with all IDs
      await supabase
        .from("ad_campaigns")
        .update({
          name: campaignName,
          platform: "facebook",
          status: "completed", 
          platform_campaign_id: campaignResult.id,
          platform_ad_set_id: adSetResult.id,
          platform_ad_id: adResult.id,
          // Use targeting JSONB field for storing detailed campaign data
          targeting: {
            campaign: campaignData,
            adSet: adSetData,
            adCreative: adCreativeData,
            platform_ad_set_id: adSetResult.id,
            platform_ad_id: adResult.id,
            platform_creative_id: creativeResult.id,
            error_message: null
          }
        })
        .eq("id", initialCampaign.id);
      
      // Return success response with all IDs
      const response: CampaignResponse = {
        campaignId: campaignResult.id,
        adSetId: adSetResult.id,
        adId: adResult.id,
        success: true,
        status: "completed",
        statusDetails: "Campaign created successfully and is in PAUSED state"
      };
      
      return new Response(
        JSON.stringify({
          ...response,
          campaignRecordId: initialCampaign.id
        }),
        { status: 200, headers }
      );
      
    } catch (error) {
      console.error("Error during Facebook campaign creation:", error);
      
      // Update campaign status to error
      await supabase
        .from("ad_campaigns")
        .update({ 
          status: "error",
          targeting: {
            ...initialCampaign.targeting,
            error_message: error.message
          }
        })
        .eq("id", initialCampaign.id);
      
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
