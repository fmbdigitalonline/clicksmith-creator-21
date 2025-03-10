
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.20.0";
import { corsHeaders } from "../_shared/cors.ts";

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

        // Create campaign record
        const campaignName = campaign_data.name || `Facebook Campaign ${new Date().toISOString().split('T')[0]}`;
        const projectId = campaign_data.project_id;
        
        // Make sure we have a project ID
        if (!projectId) {
          return errorResponse("Missing project ID", 400);
        }
        
        try {
          const { data: initialCampaign, error: initialSaveError } = await supabaseClient
            .from("ad_campaigns")
            .insert({
              name: campaignName,
              platform: "facebook",
              status: "pending", 
              project_id: projectId,
              user_id: user.id,
              creation_mode: campaign_data.creation_mode || "manual",
              // Store campaign data in the campaign_data field which is JSONB
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

          // Return the campaign ID for now
          // In a real implementation, we would continue with creating 
          // the actual campaign in Facebook's API
          return successResponse({
            campaign_id: initialCampaign.id,
            success: true,
            status: "pending",
            statusDetails: "Campaign submitted successfully and is pending creation"
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
        
        // Update the campaign status in the database
        const { data, error } = await supabaseClient
          .from('ad_campaigns')
          .update({ status: 'active' })
          .eq('id', recordId)
          .select()
          .single();
        
        if (error) {
          console.error('Error activating campaign:', error);
          return errorResponse(error.message, 500);
        }
        
        return successResponse({ success: true, data });
      }
      
      case 'deactivate': {
        // Deactivate campaign logic
        const { recordId } = requestData;
        
        if (!recordId) {
          return errorResponse('Missing campaign record ID');
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
          message: "Campaign deactivated successfully"
        });
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
