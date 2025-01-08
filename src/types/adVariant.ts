import { Json } from "@/integrations/supabase/types";

export interface AdVariant {
  id: string;
  imageUrl: string;
  platform: string;
  resizedUrls?: Record<string, string>;
  headline?: string;
  description?: string;
  callToAction?: string;
  size?: {
    width: number;
    height: number;
    label: string;
  };
}

export const convertJsonToAdVariant = (json: Json): AdVariant | null => {
  if (typeof json !== 'object' || !json || Array.isArray(json)) return null;
  
  const jsonObject = json as Record<string, Json>;
  
  // Type guard to ensure required fields exist
  if (!jsonObject.id || !jsonObject.imageUrl || !jsonObject.platform) {
    return null;
  }

  return {
    id: String(jsonObject.id),
    imageUrl: String(jsonObject.imageUrl),
    platform: String(jsonObject.platform),
    resizedUrls: jsonObject.resizedUrls as Record<string, string>,
    headline: jsonObject.headline as string | undefined,
    description: jsonObject.description as string | undefined,
    callToAction: jsonObject.callToAction as string | undefined,
    size: jsonObject.size as { width: number; height: number; label: string } | undefined,
  };
};

export const convertAdVariantToJson = (variant: AdVariant): Json => {
  const jsonObject: Record<string, Json> = {
    id: variant.id,
    imageUrl: variant.imageUrl,
    platform: variant.platform,
    resizedUrls: variant.resizedUrls || {},
    headline: variant.headline,
    description: variant.description,
    callToAction: variant.callToAction,
    size: variant.size,
  };

  return jsonObject;
};