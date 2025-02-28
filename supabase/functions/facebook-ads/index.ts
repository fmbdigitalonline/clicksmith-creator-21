
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { action, projectId, adData } = requestData;
    
    // Get user ID from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unable to get user information');
    }

    // Get user's Facebook connection
    const { data: connection, error: connectionError } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'facebook')
      .single();

    if (connectionError || !connection) {
      throw new Error('No Facebook account connected. Please connect your account first.');
    }

    // Check if token is expired
    if (new Date(connection.token_expires_at) < new Date()) {
      throw new Error('Facebook token expired. Please reconnect your account.');
    }

    // Get project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found or access denied');
    }

    if (action === 'create-campaign') {
      // Create campaign using Facebook Graph API
      const campaignResponse = await fetch(
        `https://graph.facebook.com/v16.0/act_${connection.account_id}/campaigns`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: adData.campaignName || `Campaign for ${project.title}`,
            objective: adData.objective || 'OUTCOME_AWARENESS',
            status: adData.status || 'PAUSED', // Start as paused for safety
            special_ad_categories: [],
            access_token: connection.access_token,
          }),
        }
      );

      const campaignData = await campaignResponse.json();
      
      if (campaignData.error) {
        throw new Error(`Facebook API Error: ${campaignData.error.message}`);
      }

      // Store campaign in database
      const { data: savedCampaign, error: saveCampaignError } = await supabase
        .from('ad_campaigns')
        .insert({
          user_id: user.id,
          project_id: projectId,
          platform: 'facebook',
          name: adData.campaignName || `Campaign for ${project.title}`,
          status: 'PAUSED',
          platform_campaign_id: campaignData.id,
          budget: adData.budget,
          start_date: adData.startDate,
          end_date: adData.endDate,
          targeting: adData.targeting || {}
        })
        .select()
        .single();

      if (saveCampaignError) {
        throw new Error(`Database error: ${saveCampaignError.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        campaign: savedCampaign,
        platformData: campaignData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } 
    
    else if (action === 'create-adset') {
      const { campaignId, adsetData } = adData;
      
      // Create ad set using Facebook Graph API
      const adsetResponse = await fetch(
        `https://graph.facebook.com/v16.0/act_${connection.account_id}/adsets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: adsetData.name,
            campaign_id: campaignId,
            billing_event: adsetData.billingEvent || 'IMPRESSIONS',
            daily_budget: adsetData.dailyBudget * 100, // In cents
            targeting: transformTargetingData(project.target_audience, adsetData.targeting),
            optimization_goal: adsetData.optimizationGoal || 'REACH',
            status: adsetData.status || 'PAUSED',
            access_token: connection.access_token,
          }),
        }
      );

      const adsetData = await adsetResponse.json();
      
      if (adsetData.error) {
        throw new Error(`Facebook API Error: ${adsetData.error.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        adset: adsetData 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } 
    
    else if (action === 'create-ad') {
      const { adsetId, creativeData } = adData;
      
      // Upload image if provided
      let imageHash;
      if (creativeData.imageUrl) {
        const imageResponse = await fetch(
          `https://graph.facebook.com/v16.0/act_${connection.account_id}/adimages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filename: 'ad_image.jpg',
              url: creativeData.imageUrl,
              access_token: connection.access_token,
            }),
          }
        );

        const imageData = await imageResponse.json();
        
        if (imageData.error) {
          throw new Error(`Facebook API Error: ${imageData.error.message}`);
        }
        
        imageHash = Object.values(imageData.images)[0].hash;
      }

      // Create ad creative
      const creativeResponse = await fetch(
        `https://graph.facebook.com/v16.0/act_${connection.account_id}/adcreatives`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: creativeData.name,
            object_story_spec: {
              page_id: creativeData.pageId,
              link_data: {
                message: creativeData.primaryText,
                link: creativeData.websiteUrl,
                name: creativeData.headline,
                description: creativeData.description,
                image_hash: imageHash,
                call_to_action: {
                  type: creativeData.callToAction || 'LEARN_MORE',
                }
              }
            },
            access_token: connection.access_token,
          }),
        }
      );

      const creativeResponseData = await creativeResponse.json();
      
      if (creativeResponseData.error) {
        throw new Error(`Facebook API Error: ${creativeResponseData.error.message}`);
      }

      // Create ad
      const adResponse = await fetch(
        `https://graph.facebook.com/v16.0/act_${connection.account_id}/ads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: creativeData.name,
            adset_id: adsetId,
            creative: { creative_id: creativeResponseData.id },
            status: creativeData.status || 'PAUSED',
            access_token: connection.access_token,
          }),
        }
      );

      const adResponseData = await adResponse.json();
      
      if (adResponseData.error) {
        throw new Error(`Facebook API Error: ${adResponseData.error.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        creative: creativeResponseData,
        ad: adResponseData 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    else if (action === 'get-campaigns') {
      // Get all campaigns for the user
      const { data: campaigns, error: campaignsError } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (campaignsError) {
        throw new Error(`Database error: ${campaignsError.message}`);
      }

      return new Response(JSON.stringify({ campaigns }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in facebook-ads function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to transform our audience data to Facebook targeting format
function transformTargetingData(audienceData: any, customTargeting: any = {}) {
  const targeting: any = {
    age_min: 18,
    age_max: 65,
    genders: [1, 2], // All genders
    geo_locations: {
      countries: ['US'],
    },
    ...customTargeting
  };

  // If we have audience data from our wizard, enhance the targeting
  if (audienceData) {
    // Parse demographics if available
    const demographics = audienceData.demographics || '';
    
    // Extract age ranges
    const ageMatch = demographics.match(/(\d+)[\s-]*to[\s-]*(\d+)/i);
    if (ageMatch && ageMatch.length >= 3) {
      targeting.age_min = parseInt(ageMatch[1], 10);
      targeting.age_max = parseInt(ageMatch[2], 10);
    }
    
    // Extract gender
    if (demographics.toLowerCase().includes('male') && !demographics.toLowerCase().includes('female')) {
      targeting.genders = [1]; // Male only
    } else if (demographics.toLowerCase().includes('female') && !demographics.toLowerCase().includes('male')) {
      targeting.genders = [2]; // Female only
    }
    
    // Extract interests from pain points or description
    if (audienceData.painPoints && Array.isArray(audienceData.painPoints)) {
      targeting.interests = audienceData.painPoints.map((point: string) => ({
        name: point,
        id: '6003' // This is a placeholder - normally would use FB's interest IDs
      }));
    }
  }
  
  return targeting;
}
