
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { FacebookAPI } from "../facebook-api.ts";

export async function getInsights(fbApi: FacebookAPI | null, supabase: any, userId: string, campaignId: string, timeRange: any) {
  if (!fbApi) {
    throw new Error("Facebook API not initialized. Please connect your Facebook account first.");
  }

  try {
    // Get campaign insights from Facebook
    const insights = await fbApi.getCampaignInsights(campaignId, timeRange);
    
    return {
      success: true,
      insights
    };
  } catch (error) {
    console.error("Error fetching campaign insights:", error);
    throw error;
  }
}
