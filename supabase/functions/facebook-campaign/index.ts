
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1];
    
    if (!token) {
      throw new Error('Missing authentication token');
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }
    
    // Parse request body
    const { 
      projectId, 
      campaignName, 
      settings, 
      ads,
      businessIdea,
      targetAudience
    } = await req.json();
    
    // Get Facebook access token
    const { data: connection, error: connectionError } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'facebook')
      .maybeSingle();
    
    if (connectionError) {
      throw connectionError;
    }
    
    if (!connection || !connection.access_token) {
      throw new Error('No Facebook connection found');
    }
    
    const accessToken = connection.access_token;
    const adAccountId = connection.account_id;
    
    if (!adAccountId) {
      throw new Error('No Facebook Ad Account ID found');
    }
    
    // Create campaign
    console.log("Creating Facebook campaign:", campaignName);
    const campaignResponse = await fetch(
      `https://graph.facebook.com/v16.0/act_${adAccountId}/campaigns`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: campaignName,
          objective: 'OUTCOME_AWARENESS',
          status: 'ACTIVE',
          special_ad_categories: [],
        })
      }
    );
    
    if (!campaignResponse.ok) {
      const error = await campaignResponse.text();
      console.error("Facebook API error (campaign):", error);
      throw new Error(`Failed to create campaign: ${error}`);
    }
    
    const campaignData = await campaignResponse.json();
    const campaignId = campaignData.id;
    console.log("Created campaign ID:", campaignId);
    
    // Create adset
    const adsetName = `${campaignName} - Main Audience`;
    const startDate = new Date(settings.startDate);
    const endDate = new Date(settings.endDate);
    
    // Format dates for Facebook API (YYYY-MM-DD)
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Build targeting spec
    const targetingSpec = {
      age_min: settings.ageMin,
      age_max: settings.ageMax,
      genders: settings.genders.map(g => g === 'male' ? 1 : 2),
      geo_locations: {
        countries: ["US"], // Default to US if no specific locations
      },
    };
    
    // Add interests if specified
    if (settings.interests && settings.interests.length > 0) {
      targetingSpec.flexible_spec = [
        {
          interests: settings.interests.map(interest => ({
            name: interest,
            id: `${Math.floor(1000000000 + Math.random() * 9000000000)}` // Generate fake IDs for now
          }))
        }
      ];
    }
    
    console.log("Creating adset with targeting:", targetingSpec);
    const adsetResponse = await fetch(
      `https://graph.facebook.com/v16.0/act_${adAccountId}/adsets`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: adsetName,
          campaign_id: campaignId,
          billing_event: 'IMPRESSIONS',
          daily_budget: settings.dailyBudget * 100, // Convert to cents
          optimization_goal: 'REACH',
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          targeting: targetingSpec,
          status: 'ACTIVE',
          start_time: startDateStr,
          end_time: endDateStr,
        })
      }
    );
    
    if (!adsetResponse.ok) {
      const error = await adsetResponse.text();
      console.error("Facebook API error (adset):", error);
      throw new Error(`Failed to create adset: ${error}`);
    }
    
    const adsetData = await adsetResponse.json();
    const adsetId = adsetData.id;
    console.log("Created adset ID:", adsetId);
    
    // Create ads (up to 5 ads)
    const adsToCreate = ads.slice(0, 5);
    console.log(`Creating ${adsToCreate.length} ads`);
    
    const adCreationPromises = adsToCreate.map(async (ad, index) => {
      // First, create a creative
      const creativeResponse = await fetch(
        `https://graph.facebook.com/v16.0/act_${adAccountId}/adcreatives`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            name: `Creative ${index + 1} for ${campaignName}`,
            object_story_spec: {
              page_id: '123456789', // This is a placeholder - in real implementation you'd use their actual page ID
              link_data: {
                message: ad.description,
                link: 'https://www.example.com', // Placeholder link
                name: ad.headline,
                image_hash: 'hash_placeholder', // In real implementation, you'd upload the image first and get a hash
                call_to_action: {
                  type: 'LEARN_MORE',
                }
              }
            }
          })
        }
      );
      
      if (!creativeResponse.ok) {
        const error = await creativeResponse.text();
        console.error("Facebook API error (creative):", error);
        throw new Error(`Failed to create ad creative: ${error}`);
      }
      
      const creativeData = await creativeResponse.json();
      const creativeId = creativeData.id;
      
      // Then create the ad using the creative
      const adResponse = await fetch(
        `https://graph.facebook.com/v16.0/act_${adAccountId}/ads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            name: `Ad ${index + 1} - ${ad.headline}`,
            adset_id: adsetId,
            creative: { creative_id: creativeId },
            status: 'ACTIVE',
          })
        }
      );
      
      if (!adResponse.ok) {
        const error = await adResponse.text();
        console.error("Facebook API error (ad):", error);
        throw new Error(`Failed to create ad: ${error}`);
      }
      
      return adResponse.json();
    });
    
    // Wait for all ads to be created
    const adResults = await Promise.all(adCreationPromises);
    console.log("Created ads:", adResults);
    
    // Save campaign to database
    const { data: savedCampaign, error: saveError } = await supabase
      .from('ad_campaigns')
      .insert({
        user_id: user.id,
        project_id: projectId,
        platform: 'facebook',
        name: campaignName,
        platform_campaign_id: campaignId,
        budget: settings.dailyBudget,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        targeting: settings,
        status: 'ACTIVE'
      })
      .select()
      .single();
    
    if (saveError) {
      console.error("Error saving campaign to database:", saveError);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        campaignId,
        adsetId,
        ads: adResults,
        databaseId: savedCampaign?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in facebook-campaign function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
