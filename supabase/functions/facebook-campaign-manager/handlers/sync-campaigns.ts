
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { FacebookAPI } from "../facebook-api.ts";

export async function syncCampaigns(fbApi: FacebookAPI | null, supabase: any, userId: string) {
  if (!fbApi) {
    throw new Error("Facebook API not initialized. Please connect your Facebook account first.");
  }

  try {
    // Sync campaigns from Facebook
    const campaigns = await fbApi.getCampaigns();
    
    return {
      success: true,
      campaigns,
      message: "Campaigns synced successfully"
    };
  } catch (error) {
    console.error("Error syncing campaigns:", error);
    throw error;
  }
}
