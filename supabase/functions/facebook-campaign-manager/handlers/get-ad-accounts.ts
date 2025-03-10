
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { FacebookAPI } from "../facebook-api.ts";

export async function getAdAccounts(fbApi: FacebookAPI | null, supabase: any, userId: string) {
  if (!fbApi) {
    throw new Error("Facebook API not initialized. Please connect your Facebook account first.");
  }

  try {
    // Get ad accounts from Facebook
    const adAccounts = await fbApi.getAdAccounts();
    
    return {
      success: true,
      adAccounts
    };
  } catch (error) {
    console.error("Error fetching ad accounts:", error);
    throw error;
  }
}
