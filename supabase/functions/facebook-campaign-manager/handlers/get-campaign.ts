
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { FacebookAPI } from "../facebook-api.ts";

export async function getCampaign(fbApi: FacebookAPI | null, supabase: any, userId: string, campaignId: string) {
  if (!fbApi) {
    throw new Error("Facebook API not initialized. Please connect your Facebook account first.");
  }

  try {
    // Get specific campaign from Facebook
    const campaign = await fbApi.getCampaign(campaignId);
    
    return {
      success: true,
      campaign
    };
  } catch (error) {
    console.error("Error fetching campaign:", error);
    throw error;
  }
}
