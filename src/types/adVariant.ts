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
  if (typeof json !== 'object' || !json) return null;
  
  return {
    id: String(json.id || ''),
    imageUrl: String(json.imageUrl || ''),
    platform: String(json.platform || ''),
    resizedUrls: json.resizedUrls as Record<string, string>,
    headline: json.headline as string,
    description: json.description as string,
    callToAction: json.callToAction as string,
    size: json.size as { width: number; height: number; label: string },
  };
};

export const convertAdVariantToJson = (variant: AdVariant): Json => {
  return {
    id: variant.id,
    imageUrl: variant.imageUrl,
    platform: variant.platform,
    resizedUrls: variant.resizedUrls || {},
    headline: variant.headline,
    description: variant.description,
    callToAction: variant.callToAction,
    size: variant.size,
  };
};