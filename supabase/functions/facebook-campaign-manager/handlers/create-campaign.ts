
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { FacebookAPI, validateAdImages } from "../facebook-api.ts";

export async function createCampaign(fbApi, supabase, userId, campaignData) {
  console.log("Creating campaign with data:", JSON.stringify(campaignData, null, 2));
  
  if (!fbApi) {
    throw new Error("Facebook API not initialized. Please connect your Facebook account first.");
  }
  
  if (!campaignData) {
    throw new Error("No campaign data provided");
  }
  
  // Validate ad images before proceeding
  if (campaignData.ad_details && Array.isArray(campaignData.ad_details)) {
    // Ensure all ad_details have storage_url as the primary image URL
    campaignData.ad_details = campaignData.ad_details.map(ad => ({
      ...ad,
      imageUrl: ad.storage_url || ad.imageUrl || ad.imageurl
    }));
    
    const validation = await validateAdImages(campaignData.ad_details);
    if (!validation.valid) {
      throw new Error(validation.message || "Image validation failed");
    }
  }
  
  // Insert the campaign into the database
  const { data: campaign, error: insertError } = await supabase
    .from('ad_campaigns')
    .insert({
      user_id: userId,
      name: campaignData.name,
      platform: 'facebook',
      status: 'draft',
      campaign_data: campaignData,
      project_id: campaignData.project_id,
    })
    .select('*')
    .single();
  
  if (insertError) {
    console.error("Error inserting campaign:", insertError);
    throw new Error(`Error creating campaign: ${insertError.message}`);
  }
  
  try {
    // Create Facebook campaign
    const fbCampaignId = await fbApi.createCampaign(
      campaignData.name,
      campaignData.objective,
      campaignData.budget,
      campaignData.bid_strategy,
      campaignData.bid_amount,
      campaignData.start_date,
      campaignData.end_date
    );
    
    console.log(`Facebook campaign created with ID: ${fbCampaignId}`);
    
    // Create ad set with targeting
    const adSetResponse = await fbApi.createAdSet(
      fbCampaignId,
      campaignData.name + " Ad Set",
      campaignData.budget,
      campaignData.objective,
      campaignData.targeting,
      campaignData.bid_strategy,
      campaignData.bid_amount,
      campaignData.start_date,
      campaignData.end_date
    );
    
    console.log(`Ad set created with ID: ${adSetResponse.id}`);
    
    // Create ads for each ad variant
    const adResponses = [];
    
    if (campaignData.ad_details && campaignData.ad_details.length > 0) {
      for (const adDetail of campaignData.ad_details) {
        // Prioritize storage_url over other URLs
        const imageUrl = adDetail.storage_url || adDetail.imageUrl || adDetail.imageurl;
        
        if (!imageUrl) {
          console.warn(`Ad ${adDetail.id} has no image URL, skipping`);
          continue;
        }
        
        const adResponse = await fbApi.createAd(
          adSetResponse.id,
          campaignData.name + ` Ad ${adResponses.length + 1}`,
          adDetail.headline || campaignData.name,
          adDetail.primary_text || "Check this out!",
          imageUrl,
          campaignData.additional_notes || null
        );
        
        console.log(`Ad created with ID: ${adResponse.id}`);
        adResponses.push({
          id: adResponse.id,
          adDetail: adDetail
        });
      }
    }
    
    // Update campaign in database with Facebook IDs
    const { error: updateError } = await supabase
      .from('ad_campaigns')
      .update({
        external_id: fbCampaignId,
        status: 'active',
        platform_data: {
          campaign_id: fbCampaignId,
          ad_set_id: adSetResponse.id,
          ads: adResponses.map(r => ({
            id: r.id,
            ad_detail_id: r.adDetail.id
          }))
        }
      })
      .eq('id', campaign.id);
    
    if (updateError) {
      console.error("Error updating campaign with external IDs:", updateError);
      // Continue anyway since the campaign was already created
    }
    
    return {
      campaign_id: campaign.id,
      external_id: fbCampaignId,
      status: 'active',
      ads: adResponses
    };
  } catch (error) {
    console.error("Error creating Facebook campaign:", error);
    
    // Update the campaign status to 'failed'
    await supabase
      .from('ad_campaigns')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', campaign.id);
    
    throw error;
  }
}
