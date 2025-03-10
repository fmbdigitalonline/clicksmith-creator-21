
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { FacebookAPI } from "../facebook-api.ts";

export async function getCampaigns(fbApi: FacebookAPI | null, supabase: any, userId: string, filters?: any) {
  if (!fbApi) {
    throw new Error("Facebook API not initialized. Please connect your Facebook account first.");
  }

  try {
    // Get campaigns from Facebook
    const campaigns = await fbApi.getCampaigns();

    return {
      success: true,
      campaigns
    };
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    throw error;
  }
}
