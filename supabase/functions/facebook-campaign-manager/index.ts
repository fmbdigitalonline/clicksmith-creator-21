
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
  bid_amount?: number; // Field for bid amount
  bid_strategy?: string; // Field for bid strategy
  page_id?: string; // Field for Facebook page ID
}

interface AdDetail {
  id: string;
  headline: string;
  primary_text: string;
  imageUrl: string;
  storage_url?: string;
  size?: {
    width: number;
    height: number;
    label?: string;
  };
  platform?: string;
  image_status?: string;
  fb_ad_settings?: {
    website_url: string;
    visible_link?: string;
    call_to_action?: string;
    ad_language?: string;
    url_parameters?: string;
    browser_addon?: string;
  };
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
        // First check if all images are ready
        if (campaign_data?.ads && campaign_data.ads.length > 0) {
          const imagesReady = await validateAdImages(campaign_data.ads, supabase);
          if (!imagesReady.success) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Images not ready',
              details: imagesReady.details,
              pendingImages: imagesReady.pendingImages
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 422
            });
          }
        }
        
        result = await createCampaign(campaign_data, access_token, account_id, userId, supabase, connections);
        break;
        
      case 'activate':
        result = await updateCampaignStatus(campaignId, adSetId, recordId, 'ACTIVE', access_token, supabase);
        break;
        
      case 'deactivate':
        result = await updateCampaignStatus(campaignId, adSetId, recordId, 'PAUSED', access_token, supabase);
        break;
        
      case 'check_images':
        if (!campaign_data?.ads || !Array.isArray(campaign_data.ads) || campaign_data.ads.length === 0) {
          throw new Error('No ads specified for image validation');
        }
        result = await validateAdImages(campaign_data.ads, supabase);
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

async function validateAdImages(adIds: string[], supabase: any) {
  try {
    console.log('Validating images for ads:', adIds);
    
    // Get the ad details from the database
    const { data: ads, error: adsError } = await supabase
      .from('ad_feedback')
      .select('id, headline, primary_text, imageUrl, storage_url, image_status')
      .in('id', adIds);
      
    if (adsError) {
      throw new Error(`Error fetching ad details: ${adsError.message}`);
    }
    
    if (!ads || ads.length === 0) {
      throw new Error('No ad details found for the selected ads');
    }
    
    // Check if all ads have a ready storage_url
    const pendingImages = ads.filter(ad => 
      !ad.storage_url || 
      !ad.image_status || 
      ad.image_status !== 'ready'
    );
    
    if (pendingImages.length > 0) {
      console.log('Found pending images:', pendingImages.map(ad => ad.id));
      return {
        success: false,
        details: 'Some images are not ready for Facebook ads',
        pendingImages: pendingImages.map(ad => ({
          id: ad.id,
          status: ad.image_status || 'unknown'
        }))
      };
    }
    
    return {
      success: true,
      message: 'All images are ready for Facebook ads'
    };
  } catch (error) {
    console.error('Error validating ad images:', error);
    throw error;
  }
}

async function createCampaign(
  campaignData: CampaignData,
  accessToken: string,
  accountId: string,
  userId: string,
  supabase: any,
  connections: any
) {
  console.log('Creating campaign with data:', JSON.stringify(campaignData, null, 2));
  
  // Cast the budget to an integer in cents
  const dailyBudget = Math.round(campaignData.budget * 100);
  
  try {
    // Fix: Remove account_id prefix if it already exists
    const cleanedAccountId = accountId.replace(/^act_/i, '');
    console.log('Using cleaned account ID:', cleanedAccountId);
    
    // Get the Facebook page ID
    let pageId = campaignData.page_id;
    
    // If no page_id provided, try to get it from the connection metadata
    if (!pageId && connections.metadata && connections.metadata.pages && connections.metadata.pages.length > 0) {
      if (connections.metadata.selected_page_id) {
        pageId = connections.metadata.selected_page_id;
        console.log('Using selected page ID from metadata:', pageId);
      } else {
        pageId = connections.metadata.pages[0].id;
        console.log('Using first available page ID from metadata:', pageId);
      }
    }
    
    if (!pageId) {
      throw new Error('No Facebook Page ID provided or available in connection. Please connect a Facebook Page.');
    }
    
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
      campaignData.bid_amount, 
      campaignData.bid_strategy
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
        .select('id, headline, primary_text, imageUrl, imageurl, storage_url, image_status, fb_ad_settings')
        .in('id', campaignData.ads);
      
      if (adFeedbackData && adFeedbackData.length > 0) {
        adDetails = adFeedbackData.map(ad => ({
          id: ad.id,
          headline: ad.headline,
          primary_text: ad.primary_text,
          imageUrl: ad.storage_url || ad.imageUrl || ad.imageurl, // Prefer storage_url if available
          image_status: ad.image_status,
          fb_ad_settings: ad.fb_ad_settings // Include FB ad settings
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
      
      // Make sure we're using a permanent image URL
      const imageUrl = adDetail.storage_url || adDetail.imageUrl;
      if (!imageUrl) {
        console.warn('Skipping ad with no valid image URL:', adDetail.id);
        continue;
      }

      try {
        // Prepare link data with FB ad settings
        const linkData: any = {
          call_to_action: { type: "LEARN_MORE" }
        };

        // Include Facebook ad settings if available
        if (adDetail.fb_ad_settings) {
          // Website URL is required
          const finalUrl = adDetail.fb_ad_settings.website_url;
          let urlWithParameters = finalUrl;
          
          // Add URL parameters if provided
          if (adDetail.fb_ad_settings.url_parameters) {
            const separator = finalUrl.includes('?') ? '&' : '?';
            urlWithParameters = `${finalUrl}${separator}${adDetail.fb_ad_settings.url_parameters}`;
          }
          
          linkData.link = urlWithParameters;
          
          // Add visible link if provided
          if (adDetail.fb_ad_settings.visible_link) {
            linkData.link_caption = adDetail.fb_ad_settings.visible_link;
          }
          
          // Add call to action if provided
          if (adDetail.fb_ad_settings.call_to_action) {
            // Convert friendly name to FB API format
            const ctaMap: Record<string, string> = {
              "Learn More": "LEARN_MORE",
              "Shop Now": "SHOP_NOW",
              "Sign Up": "SIGN_UP",
              "Book Now": "BOOK_NOW",
              "Contact Us": "CONTACT_US",
              "Subscribe": "SUBSCRIBE",
              "Apply Now": "APPLY_NOW",
              "Download": "DOWNLOAD",
              "Watch More": "WATCH_MORE",
              "Get Offer": "GET_OFFER"
            };
            
            linkData.call_to_action = {
              type: ctaMap[adDetail.fb_ad_settings.call_to_action] || "LEARN_MORE"
            };
          }
        } else {
          // Default URL if no settings provided
          linkData.link = "https://lovable.dev";
        }
        
        // Create ad creative
        const creative = await createFacebookAdCreative(
          campaign.id,
          adDetail.headline,
          adDetail.primary_text,
          imageUrl,
          accessToken,
          cleanedAccountId,
          pageId,
          linkData // Pass the link data with FB ad settings
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
          bid_strategy: campaignData.bid_strategy,
          page_id: pageId
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
      throw new Error(`Error updating campaign status in database: ${updateError.message}`);
    }
    
    return {
      success: true,
      campaign_status: status,
      campaign_result: campaignResult,
      ad_set_result: adSetResult
    };
  } catch (error) {
    console.error('Error updating campaign status:', error);
    throw new Error(`Failed to update campaign status: ${error.message}`);
  }
}

async function createFacebookCampaign(
  name: string,
  objective: string,
  accessToken: string,
  accountId: string
) {
  // Map the objective to Facebook's API format
  let fbObjective;
  let specialAdCategories = '[]'; // Default to no special categories
  
  // Map the objective
  switch (objective.toLowerCase()) {
    case 'awareness':
    case 'brand awareness':
      fbObjective = 'BRAND_AWARENESS';
      break;
    case 'reach':
      fbObjective = 'REACH';
      break;
    case 'traffic':
      fbObjective = 'TRAFFIC';
      break;
    case 'engagement':
      fbObjective = 'POST_ENGAGEMENT';
      break;
    case 'app installs':
    case 'app_installs':
      fbObjective = 'APP_INSTALLS';
      break;
    case 'lead generation':
    case 'leads':
      fbObjective = 'LEAD_GENERATION';
      break;
    case 'conversions':
      fbObjective = 'CONVERSIONS';
      break;
    case 'sales':
    case 'catalog sales':
      fbObjective = 'PRODUCT_CATALOG_SALES';
      break;
    case 'store traffic':
      fbObjective = 'STORE_VISITS';
      break;
    default:
      fbObjective = 'REACH'; // Default to reach if nothing matches
  }
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/act_${accountId}/campaigns`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name: name,
        objective: fbObjective,
        status: 'PAUSED', // Always create as paused first
        special_ad_categories: specialAdCategories
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
  bidAmount?: number,
  bidStrategy?: string
) {
  // Format dates for Facebook API
  const startTime = Math.floor(startDate.getTime() / 1000);
  const endTime = endDate ? Math.floor(endDate.getTime() / 1000) : undefined;
  
  // Default targeting if none provided
  const defaultTargeting = {
    age_min: 18,
    age_max: 65,
    genders: [0], // 0 = all, 1 = male, 2 = female
    geo_locations: {
      countries: ['US']
    }
  };
  
  // Build the targeting object
  let targetingSpec = { ...defaultTargeting };
  
  if (targeting) {
    // Age targeting
    if (targeting.age_min) targetingSpec.age_min = targeting.age_min;
    if (targeting.age_max) targetingSpec.age_max = targeting.age_max;
    
    // Gender targeting
    if (targeting.gender) {
      if (targeting.gender === 'MALE') {
        targetingSpec.genders = [1];
      } else if (targeting.gender === 'FEMALE') {
        targetingSpec.genders = [2];
      } else {
        targetingSpec.genders = [0]; // ALL
      }
    }
    
    // Interests
    if (targeting.interests && targeting.interests.length > 0) {
      targetingSpec.flexible_spec = [{
        interests: targeting.interests.map((interest: string) => ({
          name: interest,
          id: interest // For now, just using the interest as the id
        }))
      }];
    }
    
    // Locations
    if (targeting.locations && targeting.locations.length > 0) {
      targetingSpec.geo_locations = {};
      
      targeting.locations.forEach((location: any) => {
        if (location.key === 'countries') {
          targetingSpec.geo_locations.countries = location.value;
        } else if (location.key === 'cities') {
          targetingSpec.geo_locations.cities = location.value.map((city: string) => ({
            name: city,
            distance_unit: 'mile',
            radius: 10
          }));
        }
      });
    }
  }
  
  // Optimization goals based on objective
  let optimizationGoal;
  let billingEvent;
  
  switch (objective.toLowerCase()) {
    case 'awareness':
    case 'brand awareness':
      optimizationGoal = 'BRAND_AWARENESS';
      billingEvent = 'IMPRESSIONS';
      break;
    case 'traffic':
      optimizationGoal = 'LINK_CLICKS';
      billingEvent = 'LINK_CLICKS';
      break;
    case 'engagement':
      optimizationGoal = 'POST_ENGAGEMENT';
      billingEvent = 'POST_ENGAGEMENT';
      break;
    case 'conversions':
      optimizationGoal = 'OFFSITE_CONVERSIONS';
      billingEvent = 'IMPRESSIONS';
      break;
    case 'lead generation':
    case 'leads':
      optimizationGoal = 'LEAD_GENERATION';
      billingEvent = 'IMPRESSIONS';
      break;
    default:
      optimizationGoal = 'REACH';
      billingEvent = 'IMPRESSIONS';
  }
  
  // Determine bid strategy
  const bidConfig: any = {
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP'
  };
  
  if (bidStrategy) {
    bidConfig.bid_strategy = bidStrategy.toUpperCase();
  }
  
  if (bidAmount && bidAmount > 0) {
    bidConfig.bid_amount = bidAmount;
  }
  
  const adSetPayload: any = {
    name: name,
    campaign_id: campaignId,
    daily_budget: dailyBudget,
    billing_event: billingEvent,
    optimization_goal: optimizationGoal,
    bid_strategy: bidConfig.bid_strategy,
    targeting: targetingSpec,
    status: 'PAUSED', // Always create as paused first
    start_time: new Date(startTime * 1000).toISOString()
  };
  
  // Add bid amount if provided
  if (bidConfig.bid_amount) {
    adSetPayload.bid_amount = bidConfig.bid_amount;
  }
  
  // Add end time if provided
  if (endTime) {
    adSetPayload.end_time = new Date(endTime * 1000).toISOString();
  }
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/act_${accountId}/adsets`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(adSetPayload)
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
  accountId: string,
  pageId: string, 
  linkData: any = {}
) {
  // Default link data
  const defaultLinkData = {
    link: "https://lovable.dev",
    message: primaryText,
    link_caption: "lovable.dev",
    call_to_action: { type: "LEARN_MORE" }
  };
  
  // Merge provided link data with defaults
  const finalLinkData = {
    ...defaultLinkData,
    ...linkData,
    message: primaryText, // Always use primary text as message
    name: headline // Always use headline as name
  };
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/act_${accountId}/adcreatives`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name: `Creative for ${headline}`,
        object_story_spec: {
          page_id: pageId,
          link_data: {
            ...finalLinkData,
            image_url: imageUrl
          }
        }
      })
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error creating ad creative: ${JSON.stringify(errorData)}`);
  }
  
  return await response.json();
}

async function createFacebookAd(
  campaignId: string,
  adSetId: string,
  creativeId: string,
  name: string,
  accessToken: string,
  accountId: string
) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/act_${accountId}/ads`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name: name,
        adset_id: adSetId,
        creative: { creative_id: creativeId },
        status: 'PAUSED' // Always create as paused first
      })
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error creating ad: ${JSON.stringify(errorData)}`);
  }
  
  return await response.json();
}
