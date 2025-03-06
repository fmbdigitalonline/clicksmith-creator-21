
import { Json } from "@/integrations/supabase/types";
import { z } from "zod";

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

// Zod schema for AdAccount validation
export const AdAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  account_id: z.string(),
  account_status: z.number(),
  currency: z.string().optional(),
  timezone_name: z.string().optional(),
  capabilities: z.array(z.string()).optional()
});

// Zod schema for FacebookPage validation
export const FacebookPageSchema = z.object({
  id: z.string(),
  name: z.string(),
  access_token: z.string().optional(),
  category: z.string().optional(),
  followers_count: z.number().optional(),
  fan_count: z.number().optional()
});

// Zod schema for PlatformConnectionMetadata validation
export const PlatformConnectionMetadataSchema = z.object({
  ad_accounts: z.array(AdAccountSchema).optional(),
  pages: z.array(FacebookPageSchema).optional(),
  selected_account_id: z.string().optional(),
  last_fetched: z.string().optional()
}).catchall(z.unknown());

// Zod schema for FacebookOAuthResponse validation
export const FacebookOAuthResponseSchema = z.object({
  success: z.boolean(),
  platform: z.string().optional(),
  accountId: z.string().optional(),
  accountName: z.string().optional(),
  adAccounts: z.array(AdAccountSchema).optional(),
  pages: z.array(FacebookPageSchema).optional(),
  message: z.string().optional(),
  error: z.string().optional(),
  details: z.record(z.unknown()).optional()
});

// Helper function to validate Facebook OAuth response
export function isValidFacebookOAuthResponse(data: any): data is FacebookOAuthResponse {
  try {
    FacebookOAuthResponseSchema.parse(data);
    return true;
  } catch (error) {
    console.error("Invalid Facebook OAuth response:", error);
    return false;
  }
}

// Helper to validate metadata structure
export function validatePlatformConnectionMetadata(metadata: any): PlatformConnectionMetadata {
  try {
    return PlatformConnectionMetadataSchema.parse(metadata);
  } catch (error) {
    console.error("Invalid metadata structure:", error);
    // Return a valid empty object that conforms to the expected type
    return {
      ad_accounts: [],
      pages: []
    };
  }
}
