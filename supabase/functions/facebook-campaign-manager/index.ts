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
  facebookAdSettings?: {
    websiteUrl: string;
    visibleLink?: string;
    language?: string;
    browserAddOns?: {
      blockBrowserExtensions: boolean;
      blockPlugins: boolean;
    };
    urlParameters?: string;
  };
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
  metadata?: {
    facebookAdSettings?: {
      websiteUrl: string;
      visibleLink?: string;
      language?: string;
      browserAddOns?: {
        blockBrowserExtensions: boolean;
        blockPlugins: boolean;
      };
      urlParameters?: string;
    };
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

async function createFacebookAdCreative(
  campaignId: string,
  headline: string,
  primaryText: string,
  imageUrl: string,
  accessToken: string,
  accountId: string,
  pageId: string,
  adSettings?: {
    websiteUrl?: string;
    visibleLink?: string;
    language?: string;
    urlParameters?: string;
  }
) {
  // Fix: Ensure we have the proper account ID format for the API
  const apiAccountId = `act_${accountId.replace(/^act_/i, '')}`;
  
  // Default landing page URL if not provided in settings
  const linkUrl = adSettings?.websiteUrl || 'https://example.com';
  const urlParams = adSettings?.urlParameters || '';
  
  // Append URL parameters if provided
  const finalLinkUrl = urlParams ? `${linkUrl}${linkUrl.includes('?') ? '&' : '?'}${urlParams}` : linkUrl;
  
  console.log("Creating ad creative with page ID:", pageId);
  console.log("Using image URL:", imageUrl);
  console.log("Using link URL:", finalLinkUrl);
  
  // Check if the image URL is accessible
  try {
    const imgResponse = await fetch(imageUrl, { method: 'HEAD' });
    
    if (!imgResponse.ok) {
      console.error(`Image URL check failed with status: ${imgResponse.status}`);
      throw new Error(`Image URL ${imageUrl} is not accessible`);
    }
    
    console.log("Image URL is accessible");
  } catch (imgError) {
    console.error("Error checking image URL:", imgError);
    throw new Error(`Image URL validation failed: ${imgError.message}`);
  }
  
  // First try the standard approach with image upload
  try {
    // First, upload the image to Facebook
    console.log("Attempting to upload image to Facebook:", imageUrl);
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
      console.error(`Error uploading image: ${JSON.stringify(errorData)}`);
      throw new Error(`Error uploading image: ${JSON.stringify(errorData)}`);
    }
    
    const imageData = await imageResponse.json();
    
    // Extract the image hash from the response
    const imageHash = imageData.images?.['ad_image_' + Date.now() + '.jpg']?.hash;
    
    if (!imageHash) {
      throw new Error('Failed to get image hash from Facebook');
    }
    
    // Create creative data object with additional parameters if provided
    const creativeData: any = {
      name: `Creative for ${headline}`,
      object_story_spec: {
        page_id: pageId,
        link_data: {
          message: primaryText,
          link: finalLinkUrl,
          name: headline,
          image_hash: imageHash
        }
      }
    };
    
    // Add display URL if provided
    if (adSettings?.visibleLink) {
      creativeData.object_story_spec.link_data.call_to_action = {
        type: 'LEARN_MORE',
        value: {
          link: finalLinkUrl,
          link_caption: adSettings.visibleLink
        }
      };
    }
    
    // Add language if provided
    if (adSettings?.language) {
      creativeData.adlabels = [{
        name: `Language: ${adSettings.language}`
      }];
      
      // Note: Facebook doesn't directly support language in ad creative API
      // We're using adlabels as a workaround for tracking purposes
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
        body: JSON.stringify(creativeData)
      }
    );
    
    if (!creativeResponse.ok) {
      const errorData = await creativeResponse.json();
      throw new Error(`Error creating ad creative: ${JSON.stringify(errorData)}`);
    }
    
    return await creativeResponse.json();
  } catch (uploadError) {
    // If image upload fails, try the fallback approach with direct image URL
    console.log("Image upload failed, trying fallback approach with direct image URL");
    console.error("Error in image upload:", uploadError.message);
    
    try {
      // Fallback: Create ad creative with direct image URL
      console.log("Creating fallback ad creative with direct image URL");
      const fallbackCreativeResponse = await fetch(
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
              page_id: pageId,
              link_data: {
                message: primaryText,
                link: finalLinkUrl,
                name: headline,
                picture: imageUrl  // Use direct image URL instead of hash
              }
            }
          })
        }
      );
      
      if (!fallbackCreativeResponse.ok) {
        const errorData = await fallbackCreativeResponse.json();
        throw new Error(`Error creating fallback ad creative: ${JSON.stringify(errorData)}`);
      }
      
      return await fallbackCreativeResponse.json();
    } catch (fallbackError) {
      console.error("Fallback approach also failed:", fallbackError.message);
      
      // Try a third approach with minimal data
      console.log("Trying minimal approach for ad creative");
      try {
        const minimalCreativeResponse = await fetch(
          `https://graph.facebook.com/v18.0/${apiAccountId}/adcreatives`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              name: `Creative for ${headline}`,
              title: headline,
              body: primaryText,
              link_url: linkUrl,
              object_story_spec: {
                page_id: pageId,
                link_data: {
                  message: primaryText,
                  link: linkUrl,
                  name: headline
                }
              }
            })
          }
        );
        
        if (!minimalCreativeResponse.ok) {
          const errorData = await minimalCreativeResponse.json();
          throw new Error(`Error creating minimal ad creative: ${JSON.stringify(errorData)}`);
        }
        
        return await minimalCreativeResponse.json();
      } catch (minimalError) {
        console.error("All creative approaches failed. Last error:", minimalError.message);
        throw new Error(`Failed to create ad creative after multiple attempts: ${minimalError.message}`);
      }
    }
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
        .select('id, headline, primary_text, imageUrl, imageurl, storage_url, image_status, metadata')
        .in('id', campaignData.ads);
      
      if (adFeedbackData && adFeedbackData.length > 0) {
        adDetails = adFeedbackData.map(ad => ({
          id: ad.id,
          headline: ad.headline,
          primary_text: ad.primary_text,
          imageUrl: ad.storage_url || ad.imageUrl || ad.imageurl, // Prefer storage_url if available
          image_status: ad.image_status,
          metadata: ad.metadata
        }));
      }
    }
    
    if (adDetails.length === 0) {
      throw new Error('No ad details found for the selected ads');
    }
    
    console.log('Creating ads with details:', adDetails);
    
    // Get global Facebook ad settings if available
    const globalFacebookSettings = campaignData.facebookAdSettings;
    
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
        // Get ad-specific Facebook settings or fallback to global settings
        const adFacebookSettings = adDetail.metadata?.facebookAdSettings || globalFacebookSettings;
        
        // Create ad creative
        const creative = await createFacebookAdCreative(
          campaign.id,
          adDetail.headline,
          adDetail.primary_text,
          imageUrl,
          accessToken,
          cleanedAccountId,
          pageId,
          adFacebookSettings // Pass Facebook ad settings
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
            cleanedAccountId,
            adFacebookSettings?.browserAddOns // Pass browser add-ons options
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
          page_id: pageId,
          facebookAdSettings: campaignData.facebookAdSettings
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

async function createFacebookAd(
  campaignId: string,
  adSetId: string,
  creativeId: string,
  name: string,
  accessToken: string,
  accountId: string,
  browserAddOns?: {
    blockBrowserExtensions?: boolean;
    blockPlugins?: boolean;
  }
) {
  // Fix: Ensure we have the proper account ID format for the API
  const apiAccountId = `act_${accountId.replace(/^act_/i, '')}`;
  
  const adData: any = {
    name,
    adset_id: adSetId,
    creative: { creative_id: creativeId },
    status: 'PAUSED'
  };
  
  // Add browser add-on options if provided
  if (browserAddOns) {
    if (browserAddOns.blockBrowserExtensions) {
      adData.adlabels = adData.adlabels || [];
      adData.adlabels.push({
        name: "Block Browser Extensions"
      });
    }
    
    if (browserAddOns.blockPlugins) {
      adData.adlabels = adData.adlabels || [];
      adData.adlabels.push({
        name: "Block Plugins"
      });
    }
  }
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${apiAccountId}/ads`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(adData)
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error creating ad: ${JSON.stringify(errorData)}`);
  }
  
  return await response.json();
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
  bidAmount?: number,
  bidStrategy?: string
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
