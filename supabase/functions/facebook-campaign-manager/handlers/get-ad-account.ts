
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { FacebookAPI } from "../facebook-api.ts";

export async function getAdAccount(fbApi: FacebookAPI | null, supabase: any, userId: string, adAccountId: string) {
  if (!fbApi) {
    throw new Error("Facebook API not initialized. Please connect your Facebook account first.");
  }

  try {
    // Get specific ad account from Facebook
    const adAccount = await fbApi.getAdAccount(adAccountId);
    
    return {
      success: true,
      adAccount
    };
  } catch (error) {
    console.error("Error fetching ad account:", error);
    throw error;
  }
}
