
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
    const requestData = await req.json();
    const { operation } = requestData;
    
    console.log(`Processing Facebook campaign operation: ${operation}`, requestData);

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
        const { campaignData, adSetData, adCreativeData, projectId, campaignMode, templateId, templateName, aiSuggestionsUsed } = requestData;
        
        if (!campaignData) {
          return new Response(
            JSON.stringify({ error: 'Missing campaign data' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Validate user authentication and Facebook connection
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "Missing authorization header" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }

        // Verify JWT token from request
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

        if (userError || !user) {
          return new Response(
            JSON.stringify({ error: "Invalid or expired authentication token" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }

        // Get Facebook connection data
        const { data: connectionData, error: connectionError } = await supabaseClient
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
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
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
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Create campaign record
        const campaignName = campaignData.name || `Facebook Campaign ${new Date().toISOString().split('T')[0]}`;
        const { data: initialCampaign, error: initialSaveError } = await supabaseClient
          .from("ad_campaigns")
          .insert({
            name: campaignName,
            platform: "facebook",
            status: "pending", 
            project_id: projectId,
            user_id: user.id,
            creation_mode: campaignMode || "manual",
            template_id: templateId,
            template_name: templateName,
            ai_suggestions_used: aiSuggestionsUsed?.length > 0 ? aiSuggestionsUsed : null,
            // Store campaign data in the campaign_data field which is JSONB
            campaign_data: {
              campaign: campaignData,
              adSet: adSetData,
              adCreative: adCreativeData,
              mode: campaignMode || "manual"
            },
            image_url: adCreativeData?.object_story_spec?.link_data?.image_url
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
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        try {
          // Call Facebook API to create campaign
          console.log("Creating Facebook campaign...");
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
          
          const campaignResult = await campaignResponse.json();
          const campaignId = campaignResult.id;
          console.log("Campaign created successfully:", campaignResult);
          
          // Update campaign status
          await supabaseClient
            .from("ad_campaigns")
            .update({ 
              status: "campaign_created",
              platform_campaign_id: campaignId
            })
            .eq("id", initialCampaign.id);
          
          // Create Ad Set
          console.log("Creating Facebook ad set...");
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
                campaign_id: campaignId,
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
          
          const adSetResult = await adSetResponse.json();
          const adSetId = adSetResult.id;
          console.log("Ad Set created successfully:", adSetResult);
          
          // Update campaign status
          await supabaseClient
            .from("ad_campaigns")
            .update({ 
              status: "adset_created",
              platform_ad_set_id: adSetId
            })
            .eq("id", initialCampaign.id);
          
          // Create Ad Creative
          console.log("Creating Facebook ad creative...");
          
          // Handle page_id placeholder
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
          
          const creativeResult = await creativeResponse.json();
          const creativeId = creativeResult.id;
          console.log("Ad Creative created successfully:", creativeResult);
          
          // Create Ad
          console.log("Creating Facebook ad...");
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
                adset_id: adSetId,
                creative: { creative_id: creativeId },
                status: "PAUSED"
              }),
            }
          );
          
          if (!adResponse.ok) {
            const errorData = await adResponse.json();
            console.error("Facebook ad creation API error:", errorData);
            throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
          }
          
          const adResult = await adResponse.json();
          const adId = adResult.id;
          console.log("Ad created successfully:", adResult);
          
          // Initialize empty performance metrics
          const initialPerformanceMetrics = {
            impressions: 0,
            clicks: 0,
            spend: 0,
            last_updated: new Date().toISOString()
          };
          
          // Update campaign record with all IDs
          await supabaseClient
            .from("ad_campaigns")
            .update({
              name: campaignName,
              platform: "facebook",
              status: "completed", 
              platform_campaign_id: campaignId,
              platform_ad_set_id: adSetId,
              platform_ad_id: adId,
              performance_metrics: initialPerformanceMetrics,
              last_synced_at: new Date().toISOString(),
              campaign_data: {
                campaign: campaignData,
                adSet: adSetData,
                adCreative: adCreativeData,
                mode: campaignMode || "manual",
                platform_ad_set_id: adSetId,
                platform_ad_id: adId,
                platform_creative_id: creativeId,
                error_message: null
              }
            })
            .eq("id", initialCampaign.id);
          
          // Return success response with all IDs
          return new Response(
            JSON.stringify({
              campaignId,
              adSetId,
              adId,
              success: true,
              status: "completed",
              statusDetails: "Campaign created successfully and is in PAUSED state",
              campaignRecordId: initialCampaign.id,
              creationMode: campaignMode || "manual"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
          
        } catch (error) {
          console.error("Error during Facebook campaign creation:", error);
          
          // Update campaign status to error
          await supabaseClient
            .from("ad_campaigns")
            .update({ 
              status: "error",
              campaign_data: {
                ...initialCampaign.campaign_data,
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
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }
      
      case 'delete': {
        // Delete campaign logic (from delete-facebook-campaign)
        const { recordId } = requestData;
        
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
        const { campaignId, adSetId, recordId } = requestData;
        
        if (!recordId) {
          return new Response(
            JSON.stringify({ error: 'Missing recordId parameter' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log(`Activating campaign: ${campaignId}, adSet: ${adSetId}, record: ${recordId}`);
        
        // Get campaign info including connection details
        const { data: campaignData, error: campaignError } = await supabaseClient
          .from('ad_campaigns')
          .select('user_id, platform_campaign_id, platform_ad_set_id')
          .eq('id', recordId)
          .single();
        
        if (campaignError || !campaignData) {
          console.error('Error fetching campaign data:', campaignError);
          throw new Error('Campaign not found');
        }

        // Now get the user's Facebook connection
        const { data: connectionData, error: connectionError } = await supabaseClient
          .from('platform_connections')
          .select('access_token')
          .eq('platform', 'facebook')
          .eq('user_id', campaignData.user_id)
          .single();
        
        if (connectionError || !connectionData || !connectionData.access_token) {
          console.error('Error fetching Facebook connection:', connectionError);
          throw new Error('Facebook connection not found');
        }

        const accessToken = connectionData.access_token;
        
        if (campaignId && accessToken) {
          console.log(`Making Facebook API call to activate campaign ${campaignId}`);
          try {
            const response = await fetch(
              `https://graph.facebook.com/v18.0/${campaignId}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ status: 'ACTIVE' })
              }
            );
            const result = await response.json();
            if (!response.ok) {
              console.error('Error activating campaign in Facebook:', result);
            }

            // Also update the ad set if we have that ID
            if (adSetId) {
              console.log(`Making Facebook API call to activate ad set ${adSetId}`);
              const adSetResponse = await fetch(
                `https://graph.facebook.com/v18.0/${adSetId}`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                  },
                  body: JSON.stringify({ status: 'ACTIVE' })
                }
              );
              const adSetResult = await adSetResponse.json();
              if (!adSetResponse.ok) {
                console.error('Error activating ad set in Facebook:', adSetResult);
              }
            }
          } catch (fbError) {
            console.error('Error calling Facebook API:', fbError);
            // Continue with local status update even if Facebook API fails
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
          console.error('Error activating campaign:', error);
          throw error;
        }
        
        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'deactivate': {
        // Deactivate campaign logic (from deactivate-facebook-campaign)
        const { campaignId, adSetId, recordId } = requestData;
        
        if (!recordId) {
          return new Response(
            JSON.stringify({ error: 'Missing campaign record ID' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        // Get campaign info including connection details
        const { data: campaignData, error: campaignError } = await supabaseClient
          .from('ad_campaigns')
          .select('user_id, platform_campaign_id, platform_ad_set_id')
          .eq('id', recordId)
          .single();
        
        if (campaignError || !campaignData) {
          console.error('Error fetching campaign data:', campaignError);
          throw new Error('Campaign not found');
        }

        // Now get the user's Facebook connection
        const { data: connectionData, error: connectionError } = await supabaseClient
          .from('platform_connections')
          .select('access_token')
          .eq('platform', 'facebook')
          .eq('user_id', campaignData.user_id)
          .single();
        
        if (connectionError || !connectionData || !connectionData.access_token) {
          console.error('Error fetching Facebook connection:', connectionError);
          throw new Error('Facebook connection not found');
        }

        const accessToken = connectionData.access_token;
        const campaignIdToUse = campaignId || campaignData.platform_campaign_id;
        const adSetIdToUse = adSetId || campaignData.platform_ad_set_id;
        
        if (campaignIdToUse && accessToken) {
          console.log(`Making Facebook API call to pause campaign ${campaignIdToUse}`);
          try {
            const response = await fetch(
              `https://graph.facebook.com/v18.0/${campaignIdToUse}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ status: 'PAUSED' })
              }
            );
            const result = await response.json();
            if (!response.ok) {
              console.error('Error pausing campaign in Facebook:', result);
            }

            // Also update the ad set if we have that ID
            if (adSetIdToUse) {
              console.log(`Making Facebook API call to pause ad set ${adSetIdToUse}`);
              const adSetResponse = await fetch(
                `https://graph.facebook.com/v18.0/${adSetIdToUse}`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                  },
                  body: JSON.stringify({ status: 'PAUSED' })
                }
              );
              const adSetResult = await adSetResponse.json();
              if (!adSetResponse.ok) {
                console.error('Error pausing ad set in Facebook:', adSetResult);
              }
            }
          } catch (fbError) {
            console.error('Error calling Facebook API:', fbError);
            // Continue with local status update even if Facebook API fails
          }
        }
        
        // Update the campaign status in the database
        const { error: updateError } = await supabaseClient
          .from('ad_campaigns')
          .update({ status: 'paused' })
          .eq('id', recordId);
        
        if (updateError) {
          console.error('Error updating campaign status:', updateError);
          throw updateError;
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Campaign deactivated successfully"
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'get_campaign_details': {
        // Get campaign details logic
        const { recordId } = requestData;
        
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
        const { userId } = requestData;
        
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

      case 'get_insights': {
        // Get campaign insights logic
        const { campaignId, recordId, dateRange } = requestData;
        
        if (!campaignId && !recordId) {
          return new Response(
            JSON.stringify({ error: 'Missing campaignId or recordId parameter' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // If recordId is provided, get campaignId from database
        let fbCampaignId = campaignId;
        let userId;
        
        if (recordId) {
          const { data, error } = await supabaseClient
            .from('ad_campaigns')
            .select('user_id, platform_campaign_id')
            .eq('id', recordId)
            .single();
            
          if (error) {
            console.error('Error getting campaign record:', error);
            throw error;
          }
          
          fbCampaignId = data.platform_campaign_id;
          userId = data.user_id;
        }
        
        if (!fbCampaignId) {
          return new Response(
            JSON.stringify({ error: 'Campaign ID not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }

        // Get user's Facebook connection
        const { data: connectionData, error: connectionError } = await supabaseClient
          .from('platform_connections')
          .select('access_token')
          .eq('platform', 'facebook')
          .eq('user_id', userId)
          .single();
        
        if (connectionError || !connectionData) {
          console.error('Error getting Facebook connection:', connectionError);
          throw new Error('Facebook connection not found');
        }

        // Define date range for insights
        const today = new Date();
        const startDate = dateRange?.startDate || 
          new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
        const endDate = dateRange?.endDate || 
          new Date().toISOString().split('T')[0];

        // Call Facebook Marketing API to get insights
        try {
          const insightsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${fbCampaignId}/insights?fields=impressions,clicks,spend,ctr,reach&time_range={"since":"${startDate}","until":"${endDate}"}`,
            {
              headers: {
                'Authorization': `Bearer ${connectionData.access_token}`
              }
            }
          );
          
          if (!insightsResponse.ok) {
            const errorData = await insightsResponse.json();
            console.error('Error fetching Facebook insights:', errorData);
            throw new Error(`Facebook API error: ${JSON.stringify(errorData)}`);
          }
          
          const insightsData = await insightsResponse.json();
          
          // Update performance metrics in database if recordId is provided
          if (recordId) {
            const metrics = insightsData.data.length > 0 ? insightsData.data[0] : null;
            
            if (metrics) {
              await supabaseClient
                .from('ad_campaigns')
                .update({
                  performance_metrics: {
                    impressions: parseInt(metrics.impressions || 0),
                    clicks: parseInt(metrics.clicks || 0),
                    spend: parseFloat(metrics.spend || 0),
                    ctr: parseFloat(metrics.ctr || 0),
                    reach: parseInt(metrics.reach || 0),
                    last_updated: new Date().toISOString()
                  },
                  last_synced_at: new Date().toISOString()
                })
                .eq('id', recordId);
            }
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              insights: insightsData.data 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error getting campaign insights:', error);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: error.message || 'Error fetching insights' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
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
