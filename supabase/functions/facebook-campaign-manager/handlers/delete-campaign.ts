
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { FacebookAPI } from "../facebook-api.ts";

export async function deleteCampaign(fbApi: FacebookAPI | null, supabase: any, userId: string, campaignId: string) {
  if (!fbApi) {
    throw new Error("Facebook API not initialized. Please connect your Facebook account first.");
  }

  try {
    // Delete campaign from Facebook
    await fbApi.deleteCampaign(campaignId);
    
    return {
      success: true,
      message: "Campaign deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting campaign:", error);
    throw error;
  }
}
