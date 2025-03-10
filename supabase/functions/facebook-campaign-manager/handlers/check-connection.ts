
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { FacebookAPI } from "../facebook-api.ts";

export async function checkConnection(fbApi: FacebookAPI | null, supabase: any, userId: string) {
  if (!fbApi) {
    return {
      success: false,
      connected: false,
      message: "Not connected to Facebook"
    };
  }

  try {
    // Test the connection by trying to get ad accounts
    await fbApi.getAdAccounts();
    
    return {
      success: true,
      connected: true,
      message: "Successfully connected to Facebook"
    };
  } catch (error) {
    console.error("Error checking Facebook connection:", error);
    return {
      success: false,
      connected: false,
      message: error.message
    };
  }
}
