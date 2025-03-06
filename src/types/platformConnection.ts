
import { Json } from "@/integrations/supabase/types";

export interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  account_status: number;
  currency?: string;
  timezone_name?: string;
  capabilities?: string[];
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token?: string;
  category?: string;
  followers_count?: number;
  fan_count?: number;
}

export interface PlatformConnectionMetadata {
  ad_accounts?: AdAccount[];
  pages?: FacebookPage[];
  selected_account_id?: string;
  last_fetched?: string;
  [key: string]: any;
}

export interface PlatformConnection {
  id: string;
  platform: "facebook" | "google" | "linkedin" | "tiktok";
  account_id: string | null;
  account_name: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  metadata?: PlatformConnectionMetadata;
}

// Response type from Facebook OAuth Edge Function
export interface FacebookOAuthResponse {
  success: boolean;
  platform?: string;
  accountId?: string;
  accountName?: string;
  adAccounts?: AdAccount[];
  pages?: FacebookPage[];
  message?: string;
  error?: string;
  details?: Record<string, any>;
}

// Helper function to validate Facebook OAuth response
export function isValidFacebookOAuthResponse(data: any): data is FacebookOAuthResponse {
  return (
    data && 
    typeof data === 'object' &&
    typeof data.success === 'boolean' &&
    (data.success === true || typeof data.error === 'string')
  );
}

// Helper to validate metadata structure
export function validatePlatformConnectionMetadata(metadata: any): PlatformConnectionMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  
  // Ensure ad_accounts is an array
  if (metadata.ad_accounts && !Array.isArray(metadata.ad_accounts)) {
    metadata.ad_accounts = [];
  }
  
  // Ensure pages is an array
  if (metadata.pages && !Array.isArray(metadata.pages)) {
    metadata.pages = [];
  }
  
  return metadata as PlatformConnectionMetadata;
}
