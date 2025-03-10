
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log(`Facebook Campaign Manager Function loaded...`);

interface CampaignData {
  name: string;
  objective: string;
  budget: number;
  start_date: string;
  end_date?: string;
  targeting?: {
    age_min: number;
    age_max: number;
    gender: string;
    interests?: string[];
    locations?: string[];
  };
  status: string;
  ads: string[];
  ad_details?: any[]; // Array of objects with ad details
  project_id?: string;
  creation_mode: string;
  type: string;
  additional_notes?: string;
  bid_amount?: number; // New field for bid amount
  bid_strategy?: string; // New field for bid strategy
}

interface AdDetail {
  id: string;
  headline: string;
  primary_text: string;
  imageUrl: string;
  size?: {
    width: number;
    height: number;
    label?: string;
  };
  platform?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204 
    });
  }

  try {
    // Create Supabase client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });
    
    // Get user ID from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !user) {
      throw new Error('Unauthorized: ' + (userError?.message || 'Invalid user token'));
    }
    
    const userId = user.id;
    
    // Parse request body
    const body = await req.json();
    const { operation, campaignId, adSetId, recordId, campaign_data } = body;
    
    console.log('Operation requested:', operation);
    console.log('User ID:', userId);
    
    // Check Facebook integration is set up
    const { data: connections, error: connectionsError } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'facebook')
      .maybeSingle();
    
    if (connectionsError) {
      throw new Error(`Error fetching Facebook connection: ${connectionsError.message}`);
    }
    
    if (!connections || !connections.access_token) {
      throw new Error('Facebook connection not found. Please connect your Facebook account first.');
    }
    
    // Get access token and account ID
    const { access_token, account_id } = connections;
    
    if (!access_token || !account_id) {
      throw new Error('Facebook access token or account ID not found');
    }
    
    // Handle different operations
    let result;
    
    switch (operation) {
      case 'create_campaign':
        result = await createCampaign(campaign_data, access_token, account_id, userId, supabase);
        break;
        
      case 'activate':
        result = await updateCampaignStatus(campaignId, adSetId, recordId, 'ACTIVE', access_token, supabase);
        break;
        
      case 'deactivate':
        result = await updateCampaignStatus(campaignId, adSetId, recordId, 'PAUSED', access_token, supabase);
        break;
        
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(JSON.stringify({
      error: {
        message: `Failed to process request: ${error.message}`,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});

async function createCampaign(
  campaignData: CampaignData,
  accessToken: string,
  accountId: string,
  userId: string,
  supabase: any
) {
  console.log('Creating campaign with data:', JSON.stringify(campaignData, null, 2));
  
  // Cast the budget to an integer in cents
  const dailyBudget = Math.round(campaignData.budget * 100);
  
  try {
    // Fix: Remove account_id prefix if it already exists
    const cleanedAccountId = accountId.replace(/^act_/i, '');
    console.log('Using cleaned account ID:', cleanedAccountId);
    
    // Step 1: Create the campaign
    const campaign = await createFacebookCampaign(
      campaignData.name,
      campaignData.objective,
      accessToken,
      cleanedAccountId
    );
    
    if (!campaign.id) {
      throw new Error('Failed to create Facebook campaign');
    }
    
    console.log('Campaign created:', campaign);
    
    // Step 2: Create the Ad Set with targeting
    const startDate = new Date(campaignData.start_date);
    let endDate = undefined;
    
    if (campaignData.end_date) {
      endDate = new Date(campaignData.end_date);
    }
    
    const adSet = await createFacebookAdSet(
      campaign.id,
      campaignData.name + ' Ad Set',
      dailyBudget,
      startDate,
      endDate,
      campaignData.targeting,
      campaignData.objective,
      accessToken,
      cleanedAccountId,
      campaignData.bid_amount, // Pass the bid amount
      campaignData.bid_strategy // Pass the bid strategy
    );
    
    if (!adSet.id) {
      throw new Error('Failed to create Facebook ad set');
    }
    
    console.log('Ad Set created:', adSet);
    
    // Step 3: Create ads for each creative
    const adCreatives = [];
    const ads = [];
    
    // Use ad_details array if it exists, otherwise try to fetch from database
    let adDetails = campaignData.ad_details || [];
    
    if (adDetails.length === 0 && campaignData.ads.length > 0) {
      // Attempt to fetch ad details from database if not provided
      console.log('Ad details not provided, fetching from database...');
      const { data: adFeedbackData } = await supabase
        .from('ad_feedback')
        .select('id, headline, primary_text, imageUrl, imageurl')
        .in('id', campaignData.ads);
      
      if (adFeedbackData && adFeedbackData.length > 0) {
        adDetails = adFeedbackData.map(ad => ({
          id: ad.id,
          headline: ad.headline,
          primary_text: ad.primary_text,
          imageUrl: ad.imageUrl || ad.imageurl
        }));
      }
    }
    
    if (adDetails.length === 0) {
      throw new Error('No ad details found for the selected ads');
    }
    
    console.log('Creating ads with details:', adDetails);
    
    // Create ad creative and ad for each selected ad
    for (const adDetail of adDetails) {
      if (!adDetail.headline || !adDetail.primary_text || !adDetail.imageUrl) {
        console.warn('Skipping ad with missing details:', adDetail.id);
        continue;
      }
      
      try {
        // Create ad creative
        const creative = await createFacebookAdCreative(
          campaign.id,
          adDetail.headline,
          adDetail.primary_text,
          adDetail.imageUrl,
          accessToken,
          cleanedAccountId
        );
        
        console.log('Ad Creative created:', creative);
        adCreatives.push(creative);
        
        // Create ad using the creative
        if (creative.id) {
          const ad = await createFacebookAd(
            campaign.id,
            adSet.id,
            creative.id,
            adDetail.headline + ' Ad',
            accessToken,
            cleanedAccountId
          );
          
          console.log('Ad created:', ad);
          ads.push(ad);
        }
      } catch (error) {
        console.error('Error creating ad for', adDetail.id, ':', error.message);
      }
    }
    
    if (ads.length === 0) {
      throw new Error('Failed to create any ads');
    }
    
    // Step 4: Record the campaign in the database
    const { data: savedCampaign, error: saveError } = await supabase
      .from('ad_campaigns')
      .insert({
        name: campaignData.name,
        platform: 'facebook',
        status: 'completed', // Set to 'completed' but default to paused state in Facebook
        user_id: userId,
        project_id: campaignData.project_id,
        platform_campaign_id: campaign.id,
        platform_ad_set_id: adSet.id,
        platform_ad_id: ads[0]?.id, // Just store the first ad ID if multiple
        budget: campaignData.budget,
        start_date: startDate,
        end_date: endDate,
        targeting: campaignData.targeting,
        campaign_data: {
          campaign,
          adSet,
          ads,
          adCreatives,
          objective: campaignData.objective,
          creation_mode: campaignData.creation_mode,
          additional_notes: campaignData.additional_notes,
          bid_amount: campaignData.bid_amount,
          bid_strategy: campaignData.bid_strategy
        },
        creation_mode: campaignData.creation_mode
      })
      .select('id')
      .single();
    
    if (saveError) {
      throw new Error(`Error saving campaign record: ${saveError.message}`);
    }
    
    return {
      success: true,
      campaign_id: savedCampaign.id,
      facebook_campaign_id: campaign.id,
      facebook_ad_set_id: adSet.id,
      facebook_ads: ads.map(ad => ad.id)
    };
    
  } catch (error) {
    console.error('Failed to create Facebook campaign:', error);
    
    throw new Error(`Failed to create Facebook campaign: ${error.message}`);
  }
}

async function updateCampaignStatus(
  campaignId: string,
  adSetId: string,
  recordId: string,
  status: 'ACTIVE' | 'PAUSED',
  accessToken: string,
  supabase: any
) {
  try {
    // Update campaign status
    const campaignResponse = await fetch(
      `https://graph.facebook.com/v18.0/${campaignId}?fields=status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          status: status
        })
      }
    );
    
    if (!campaignResponse.ok) {
      const errorData = await campaignResponse.json();
      throw new Error(`Error updating campaign status: ${JSON.stringify(errorData)}`);
    }
    
    const campaignResult = await campaignResponse.json();
    
    // Update ad set status
    const adSetResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adSetId}?fields=status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          status: status
        })
      }
    );
    
    if (!adSetResponse.ok) {
      const errorData = await adSetResponse.json();
      throw new Error(`Error updating ad set status: ${JSON.stringify(errorData)}`);
    }
    
    const adSetResult = await adSetResponse.json();
    
    // Update status in database
    const dbStatus = status === 'ACTIVE' ? 'active' : 'paused';
    
    const { error: updateError } = await supabase
      .from('ad_campaigns')
      .update({ status: dbStatus })
      .eq('id', recordId);
    
    if (updateError) {
      throw new Error(`Error updating campaign record: ${updateError.message}`);
    }
    
    return {
      success: true,
      campaign: campaignResult,
      adSet: adSetResult,
      status: dbStatus
    };
    
  } catch (error) {
    console.error('Failed to update campaign status:', error);
    
    throw new Error(`Failed to update campaign status: ${error.message}`);
  }
}

async function createFacebookCampaign(
  name: string,
  objective: string,
  accessToken: string,
  accountId: string
) {
  // Fix: Ensure we have the proper account ID format for the API
  const apiAccountId = `act_${accountId.replace(/^act_/i, '')}`;
  
  console.log(`Creating campaign with account ID: ${apiAccountId}`);
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${apiAccountId}/campaigns`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name,
        objective,
        status: 'PAUSED', // Always create in paused state
        special_ad_categories: []
      })
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error creating campaign: ${JSON.stringify(errorData)}`);
  }
  
  return await response.json();
}

async function createFacebookAdSet(
  campaignId: string,
  name: string,
  dailyBudget: number,
  startDate: Date,
  endDate: Date | undefined,
  targeting: any,
  objective: string,
  accessToken: string,
  accountId: string,
  bidAmount?: number, // Add bid amount parameter
  bidStrategy?: string // Add bid strategy parameter
) {
  // Fix: Ensure we have the proper account ID format for the API
  const apiAccountId = `act_${accountId.replace(/^act_/i, '')}`;
  
  // Format dates for Facebook API
  const formattedStartDate = startDate.toISOString();
  const formattedEndDate = endDate ? endDate.toISOString() : undefined;
  
  // Map gender values to Facebook format
  let genderArray = [1, 2]; // Default: all genders
  if (targeting?.gender === 'MALE') {
    genderArray = [1];
  } else if (targeting?.gender === 'FEMALE') {
    genderArray = [2];
  }
  
  // Determine optimization goal and billing event based on objective
  let optimizationGoal = 'REACH';
  let billingEvent = 'IMPRESSIONS';
  
  switch (objective) {
    case 'OUTCOME_AWARENESS':
      optimizationGoal = 'REACH';
      billingEvent = 'IMPRESSIONS';
      break;
    case 'OUTCOME_TRAFFIC':
      optimizationGoal = 'LINK_CLICKS';
      billingEvent = 'LINK_CLICKS';
      break;
    case 'OUTCOME_ENGAGEMENT':
      optimizationGoal = 'POST_ENGAGEMENT';
      billingEvent = 'IMPRESSIONS';
      break;
    case 'OUTCOME_SALES':
      optimizationGoal = 'OFFSITE_CONVERSIONS';
      billingEvent = 'IMPRESSIONS';
      break;
    case 'OUTCOME_LEADS':
      optimizationGoal = 'LEAD_GENERATION';
      billingEvent = 'IMPRESSIONS';
      break;
    case 'OUTCOME_APP_PROMOTION':
      optimizationGoal = 'APP_INSTALLS';
      billingEvent = 'IMPRESSIONS';
      break;
  }
  
  // Prepare targeting spec
  const targetingSpec: any = {
    age_min: targeting?.age_min || 18,
    age_max: targeting?.age_max || 65,
    genders: genderArray
  };
  
  // Add interests if specified
  if (targeting?.interests && targeting.interests.length > 0) {
    targetingSpec.flexible_spec = [{
      interests: targeting.interests.map((interest: string) => ({
        name: interest,
        id: interest // This assumes interest is the ID, which may need to be retrieved from Facebook
      }))
    }];
  }
  
  // Add locations if specified
  if (targeting?.locations && targeting.locations.length > 0) {
    targetingSpec.geo_locations = {
      countries: targeting.locations
    };
  } else {
    // Default to United States if no location is specified
    targetingSpec.geo_locations = {
      countries: ['US']
    };
  }
  
  const adSetData: any = {
    name,
    campaign_id: campaignId,
    daily_budget: dailyBudget,
    start_time: formattedStartDate,
    targeting: targetingSpec,
    optimization_goal: optimizationGoal,
    billing_event: billingEvent,
    status: 'PAUSED'
  };
  
  // Add bid amount if provided
  if (bidAmount && bidAmount > 0) {
    adSetData.bid_amount = Math.round(bidAmount * 100); // Convert to cents
  }
  
  // Add bid strategy if provided
  if (bidStrategy) {
    adSetData.bid_strategy = bidStrategy;
  } else {
    // Default to LOWEST_COST_WITHOUT_CAP if not provided
    adSetData.bid_strategy = 'LOWEST_COST_WITHOUT_CAP';
  }
  
  if (formattedEndDate) {
    adSetData.end_time = formattedEndDate;
  }
  
  console.log('Creating ad set with data:', JSON.stringify(adSetData, null, 2));
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${apiAccountId}/adsets`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(adSetData)
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error creating ad set: ${JSON.stringify(errorData)}`);
  }
  
  return await response.json();
}

async function createFacebookAdCreative(
  campaignId: string,
  headline: string,
  primaryText: string,
  imageUrl: string,
  accessToken: string,
  accountId: string
) {
  // Fix: Ensure we have the proper account ID format for the API
  const apiAccountId = `act_${accountId.replace(/^act_/i, '')}`;
  
  // Default landing page URL if not provided
  const linkUrl = 'https://example.com';
  
  // First, upload the image to Facebook
  const imageResponse = await fetch(
    `https://graph.facebook.com/v18.0/${apiAccountId}/adimages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        filename: `ad_image_${Date.now()}.jpg`,
        url: imageUrl
      })
    }
  );
  
  if (!imageResponse.ok) {
    const errorData = await imageResponse.json();
    throw new Error(`Error uploading image: ${JSON.stringify(errorData)}`);
  }
  
  const imageData = await imageResponse.json();
  
  // Extract the image hash from the response
  const imageHash = imageData.images?.['ad_image_' + Date.now() + '.jpg']?.hash;
  
  if (!imageHash) {
    throw new Error('Failed to get image hash from Facebook');
  }
  
  // Now create the ad creative with the image
  const creativeResponse = await fetch(
    `https://graph.facebook.com/v18.0/${apiAccountId}/adcreatives`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name: `Creative for ${headline}`,
        object_story_spec: {
          page_id: accountId, // Using account ID, but ideally should be a page ID
          link_data: {
            message: primaryText,
            link: linkUrl,
            name: headline,
            image_hash: imageHash
          }
        }
      })
    }
  );
  
  if (!creativeResponse.ok) {
    const errorData = await creativeResponse.json();
    throw new Error(`Error creating ad creative: ${JSON.stringify(errorData)}`);
  }
  
  return await creativeResponse.json();
}

async function createFacebookAd(
  campaignId: string,
  adSetId: string,
  creativeId: string,
  name: string,
  accessToken: string,
  accountId: string
) {
  // Fix: Ensure we have the proper account ID format for the API
  const apiAccountId = `act_${accountId.replace(/^act_/i, '')}`;
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${apiAccountId}/ads`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name,
        adset_id: adSetId,
        creative: { creative_id: creativeId },
        status: 'PAUSED'
      })
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error creating ad: ${JSON.stringify(errorData)}`);
  }
  
  return await response.json();
}
