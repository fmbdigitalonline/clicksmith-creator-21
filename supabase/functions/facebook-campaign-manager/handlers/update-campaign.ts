
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { FacebookAPI } from "../facebook-api.ts";

export async function updateCampaign(fbApi: FacebookAPI | null, supabase: any, userId: string, campaignId: string, campaignData: any) {
  if (!fbApi) {
    throw new Error("Facebook API not initialized. Please connect your Facebook account first.");
  }

  try {
    // Update campaign in Facebook
    await fbApi.updateCampaign(campaignId, campaignData);
    
    return {
      success: true,
      message: "Campaign updated successfully"
    };
  } catch (error) {
    console.error("Error updating campaign:", error);
    throw error;
  }
}
