
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.20.0";
import { corsHeaders } from "../_shared/cors.ts";

// Facebook Graph API endpoint
const FB_GRAPH_API = "https://graph.facebook.com/v18.0";

serve(async (req) => {
  // Always handle CORS preflight requests first
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Create error response helper to ensure consistent CORS headers
  const errorResponse = (message, status = 400, additionalData = {}) => {
    console.error(`Error: ${message}, Status: ${status}`);
    return new Response(
      JSON.stringify({ 
        error: message, 
        status: status >= 500 ? "server_error" : "client_error",
        ...additionalData
      }),
      { 
        status, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );
  };

  // Create success response helper
  const successResponse = (data) => {
    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );
  };

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse the request
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    const { operation } = requestData;
    
    console.log(`Processing Facebook campaign operation: ${operation}`, requestData);

    if (!operation) {
      return errorResponse('Missing operation parameter');
    }

    // Handle different operations
    switch (operation) {
      case 'create_campaign': {
        // Create campaign logic
        const { campaign_data } = requestData;
        
        if (!campaign_data) {
          return errorResponse('Missing campaign data');
        }

        // Validate user authentication
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
          return errorResponse("Missing authorization header", 401);
        }

        // Verify JWT token from request
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

        if (userError || !user) {
          return errorResponse("Invalid or expired authentication token", 401);
        }

        // Get Facebook connection data
        const { data: connectionData, error: connectionError } = await supabaseClient
          .from("platform_connections")
          .select("*")
          .eq("platform", "facebook")
          .eq("user_id", user.id)
          .single();

        if (connectionError || !connectionData) {
          return errorResponse(
            "Facebook account not connected",
            400,
            {
              statusDetails: "Please reconnect your Facebook account",
              status: "auth_error"
            }
          );
        }

        // Get Facebook access token and account ID
        const accessToken = connectionData.access_token;
        const adAccountId = connectionData.account_id;

        if (!accessToken || !adAccountId) {
          return errorResponse(
            "Missing Facebook credentials",
            400,
            {
              statusDetails: "Facebook access token or ad account ID is missing",
              status: "auth_error"
            }
          );
        }

        try {
          // Create campaign record in our database first
          const campaignName = campaign_data.name || `Facebook Campaign ${new Date().toISOString().split('T')[0]}`;
          const projectId = campaign_data.project_id;
          
          // Make sure we have a project ID
          if (!projectId) {
            return errorResponse("Missing project ID", 400);
          }
          
          const { data: initialCampaign, error: initialSaveError } = await supabaseClient
            .from("ad_campaigns")
            .insert({
              name: campaignName,
              platform: "facebook",
              status: "pending", 
              project_id: projectId,
              user_id: user.id,
              creation_mode: campaign_data.creation_mode || "manual",
              campaign_data: campaign_data
            })
            .select()
            .single();

          if (initialSaveError) {
            console.error("Error creating initial campaign record:", initialSaveError);
            return errorResponse(
              "Failed to initialize campaign tracking",
              500,
              {
                statusDetails: "Database error occurred",
                status: "db_error"
              }
            );
          }

          // Format budget as daily_budget in cents (Facebook requires it in cents)
          const dailyBudget = Math.floor((campaign_data.budget || 50) * 100);
          
          // Now actually create the campaign in Facebook
          console.log(`Creating Facebook campaign with account ID: ${adAccountId} and access token length: ${accessToken.length}`);
          
          // FIXED: Remove duplicate 'act_' prefix - the adAccountId already contains the prefix
          const formattedAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
          
          // Log correctly formatted account ID for debugging
          console.log(`Using formatted account ID: ${formattedAccountId}`);
          
          // Create the campaign on Facebook - FIXED: Using the correct account ID path
          const campaignResponse = await fetch(
            `${FB_GRAPH_API}/${formattedAccountId}/campaigns`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: campaignName,
                objective: campaign_data.objective || 'AWARENESS',
                status: 'PAUSED', // Start as paused so users can review before launching
                special_ad_categories: [],
                access_token: accessToken,
              }),
            }
          );
          
          const campaignResult = await campaignResponse.json();
          console.log("Facebook campaign creation result:", campaignResult);
          
          if (!campaignResponse.ok || campaignResult.error) {
            console.error("Failed to create Facebook campaign:", campaignResult);
            
            // Update our local record to reflect the error
            await supabaseClient
              .from("ad_campaigns")
              .update({ 
                status: "failed",
                campaign_data: {
                  ...campaign_data,
                  error: campaignResult.error || "Unknown Facebook API error"
                }
              })
              .eq("id", initialCampaign.id);
              
            return errorResponse(
              campaignResult.error?.message || "Failed to create Facebook campaign",
              400,
              {
                statusDetails: "Facebook API error: " + (campaignResult.error?.message || "Unknown error"),
                facebookError: campaignResult.error,
                campaignId: initialCampaign.id
              }
            );
          }
          
          const campaignId = campaignResult.id;
          
          // Create an ad set
          const today = new Date();
          const endDate = campaign_data.end_date ? new Date(campaign_data.end_date) : null;
          
          // Extract targeting information
          const targeting = campaign_data.targeting || {
            age_min: 18,
            age_max: 65,
            gender: "ALL",
            locations: [{ "key": "countries", "value": ["US"] }],
            interests: []
          };
          
          // Format targeting for Facebook API
          const fbTargeting = {
            age_min: targeting.age_min || 18,
            age_max: targeting.age_max || 65,
            genders: targeting.gender === "MALE" ? [1] : 
                     targeting.gender === "FEMALE" ? [2] : [1, 2],
            geo_locations: {
              countries: ["US"], // Default to US if no locations specified
            },
          };
          
          // Add interests if available
          if (targeting.interests && targeting.interests.length > 0) {
            fbTargeting.flexible_spec = [{
              interests: targeting.interests.map(interest => ({
                id: typeof interest === 'object' ? interest.id : interest,
                name: typeof interest === 'object' ? interest.name : interest
              }))
            }];
          }
          
          // Create the ad set - FIXED: Using the correct account ID format here too
          const adSetResponse = await fetch(
            `${FB_GRAPH_API}/${formattedAccountId}/adsets`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: `${campaignName} - Ad Set`,
                campaign_id: campaignId,
                optimization_goal: campaign_data.objective === 'CONVERSIONS' ? 'OFFSITE_CONVERSIONS' : 
                                  campaign_data.objective === 'TRAFFIC' ? 'LINK_CLICKS' : 'REACH',
                billing_event: campaign_data.objective === 'CONVERSIONS' ? 'IMPRESSIONS' : 
                              campaign_data.objective === 'TRAFFIC' ? 'LINK_CLICKS' : 'IMPRESSIONS',
                bid_amount: 1000, // $10.00 in cents as default bid
                daily_budget: dailyBudget,
                targeting: fbTargeting,
                status: 'PAUSED',
                start_time: today.toISOString(),
                end_time: endDate ? endDate.toISOString() : undefined,
                access_token: accessToken,
              }),
            }
          );
          
          const adSetResult = await adSetResponse.json();
          console.log("Facebook ad set creation result:", adSetResult);
          
          if (!adSetResponse.ok || adSetResult.error) {
            console.error("Failed to create Facebook ad set:", adSetResult);
            
            // Update our local record to reflect the error
            await supabaseClient
              .from("ad_campaigns")
              .update({ 
                status: "failed",
                platform_campaign_id: campaignId,
                campaign_data: {
                  ...campaign_data,
                  error: adSetResult.error || "Failed to create ad set"
                }
              })
              .eq("id", initialCampaign.id);
              
            return errorResponse(
              adSetResult.error?.message || "Failed to create Facebook ad set",
              400,
              {
                statusDetails: "Facebook API error: " + (adSetResult.error?.message || "Unknown error"),
                facebookError: adSetResult.error,
                campaignId: initialCampaign.id,
                platform_campaign_id: campaignId
              }
            );
          }
          
          const adSetId = adSetResult.id;
          
          // Update our database record with the Facebook IDs
          await supabaseClient
            .from("ad_campaigns")
            .update({
              status: "paused", // Mark as paused since the FB campaign is created in paused state
              platform_campaign_id: campaignId,
              platform_ad_set_id: adSetId,
              campaign_data: {
                ...campaign_data,
                facebook_campaign_id: campaignId,
                facebook_ad_set_id: adSetId
              }
            })
            .eq("id", initialCampaign.id);
          
          // Return success with the campaign details
          return successResponse({
            success: true,
            campaign_id: initialCampaign.id,
            platform_campaign_id: campaignId,
            platform_ad_set_id: adSetId,
            status: "paused",
            statusDetails: "Campaign created successfully on Facebook in paused state. You can now activate it."
          });
        
        } catch (error) {
          console.error("Error processing campaign creation:", error);
          return errorResponse(
            error.message || "Unknown error occurred during campaign processing",
            500,
            {
              statusDetails: "Server error while processing campaign",
              status: "server_error"
            }
          );
        }
      }
      
      case 'delete': {
        // Delete campaign logic
        const { recordId } = requestData;
        
        if (!recordId) {
          return errorResponse('Missing recordId parameter');
        }
        
        // Delete the campaign from the database
        const { error } = await supabaseClient
          .from('ad_campaigns')
          .delete()
          .eq('id', recordId);
        
        if (error) {
          console.error('Error deleting campaign:', error);
          return errorResponse(error.message, 500);
        }
        
        return successResponse({ success: true });
      }
      
      case 'activate': {
        // Activate campaign logic
        const { recordId } = requestData;
        
        if (!recordId) {
          return errorResponse('Missing recordId parameter');
        }
        
        // Get campaign details from database
        const { data: campaign, error: campaignError } = await supabaseClient
          .from('ad_campaigns')
          .select('*')
          .eq('id', recordId)
          .single();
          
        if (campaignError || !campaign) {
          return errorResponse('Campaign not found', 404);
        }
        
        // Get user's Facebook credentials
        const { data: connection, error: connectionError } = await supabaseClient
          .from('platform_connections')
          .select('*')
          .eq('platform', 'facebook')
          .eq('user_id', campaign.user_id)
          .single();
          
        if (connectionError || !connection) {
          return errorResponse('Facebook connection not found', 400);
        }
        
        const accessToken = connection.access_token;
        
        if (!campaign.platform_campaign_id) {
          return errorResponse('No Facebook campaign ID found', 400);
        }
        
        try {
          // Activate the campaign on Facebook
          const campaignResponse = await fetch(
            `${FB_GRAPH_API}/${campaign.platform_campaign_id}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                status: 'ACTIVE',
                access_token: accessToken,
              }),
            }
          );
          
          const campaignResult = await campaignResponse.json();
          
          if (!campaignResponse.ok || campaignResult.error) {
            console.error("Failed to activate Facebook campaign:", campaignResult);
            return errorResponse(
              campaignResult.error?.message || "Failed to activate Facebook campaign",
              400
            );
          }
          
          // If there's an ad set, activate it too
          if (campaign.platform_ad_set_id) {
            const adSetResponse = await fetch(
              `${FB_GRAPH_API}/${campaign.platform_ad_set_id}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  status: 'ACTIVE',
                  access_token: accessToken,
                }),
              }
            );
            
            const adSetResult = await adSetResponse.json();
            
            if (!adSetResponse.ok || adSetResult.error) {
              console.error("Failed to activate Facebook ad set:", adSetResult);
            }
          }
          
          // Update the campaign status in the database
          const { data, error } = await supabaseClient
            .from('ad_campaigns')
            .update({ status: 'active' })
            .eq('id', recordId)
            .select()
            .single();
          
          if (error) {
            console.error('Error updating campaign status:', error);
            return errorResponse(error.message, 500);
          }
          
          return successResponse({ 
            success: true, 
            data,
            statusDetails: "Campaign activated successfully on Facebook"
          });
        } catch (error) {
          console.error("Error activating campaign:", error);
          return errorResponse(
            error.message || "Unknown error occurred during campaign activation",
            500
          );
        }
      }
      
      case 'deactivate': {
        // Deactivate campaign logic
        const { recordId } = requestData;
        
        if (!recordId) {
          return errorResponse('Missing campaign record ID');
        }
        
        // Get campaign details from database
        const { data: campaign, error: campaignError } = await supabaseClient
          .from('ad_campaigns')
          .select('*')
          .eq('id', recordId)
          .single();
          
        if (campaignError || !campaign) {
          return errorResponse('Campaign not found', 404);
        }
        
        // Get user's Facebook credentials
        const { data: connection, error: connectionError } = await supabaseClient
          .from('platform_connections')
          .select('*')
          .eq('platform', 'facebook')
          .eq('user_id', campaign.user_id)
          .single();
          
        if (connectionError || !connection) {
          return errorResponse('Facebook connection not found', 400);
        }
        
        const accessToken = connection.access_token;
        
        if (!campaign.platform_campaign_id) {
          return errorResponse('No Facebook campaign ID found', 400);
        }
        
        try {
          // Deactivate (pause) the campaign on Facebook
          const campaignResponse = await fetch(
            `${FB_GRAPH_API}/${campaign.platform_campaign_id}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                status: 'PAUSED',
                access_token: accessToken,
              }),
            }
          );
          
          const campaignResult = await campaignResponse.json();
          
          if (!campaignResponse.ok || campaignResult.error) {
            console.error("Failed to pause Facebook campaign:", campaignResult);
            return errorResponse(
              campaignResult.error?.message || "Failed to pause Facebook campaign",
              400
            );
          }
          
          // Update the campaign status in the database
          const { error: updateError } = await supabaseClient
            .from('ad_campaigns')
            .update({ status: 'paused' })
            .eq('id', recordId);
          
          if (updateError) {
            console.error('Error updating campaign status:', updateError);
            return errorResponse(updateError.message, 500);
          }
          
          return successResponse({ 
            success: true, 
            message: "Campaign paused successfully on Facebook"
          });
        } catch (error) {
          console.error("Error pausing campaign:", error);
          return errorResponse(
            error.message || "Unknown error occurred during campaign deactivation",
            500
          );
        }
      }
      
      case 'get_campaign_details': {
        // Get campaign details logic
        const { recordId } = requestData;
        
        if (!recordId) {
          return errorResponse('Missing recordId parameter');
        }
        
        // Fetch campaign details from database
        const { data, error } = await supabaseClient
          .from('ad_campaigns')
          .select('*')
          .eq('id', recordId)
          .maybeSingle();
        
        if (error) {
          console.error('Error getting campaign details:', error);
          return errorResponse(error.message, 500);
        }
        
        return successResponse({ success: true, campaign: data });
      }
      
      case 'verify_connection': {
        // Verify that user has an active Facebook connection
        const { userId } = requestData;
        
        if (!userId) {
          return errorResponse('Missing userId parameter');
        }
        
        const { data, error } = await supabaseClient
          .from('platform_connections')
          .select('*')
          .eq('platform', 'facebook')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (error) {
          console.error('Error verifying connection:', error);
          return errorResponse(error.message, 500);
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
        
        return successResponse({ 
          success: true, 
          isValid,
          message,
          connection: data
        });
      }
      
      default:
        return errorResponse(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    console.error('Unhandled error in Facebook campaign manager:', error);
    return errorResponse(
      error.message || 'Internal server error',
      500
    );
  }
});
