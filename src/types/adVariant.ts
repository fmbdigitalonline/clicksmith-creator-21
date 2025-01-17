import { Json } from "@/integrations/supabase/types";

export interface AdVariant {
  id?: string;
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
  
  // Ensure required fields exist
  if (!jsonObject.imageUrl || !jsonObject.platform) {
    return null;
  }

  return {
    id: String(jsonObject.id),
    imageUrl: String(jsonObject.imageUrl),
    platform: String(jsonObject.platform),
    resizedUrls: jsonObject.resizedUrls as Record<string, string>,
    headline: jsonObject.headline as string,
    description: jsonObject.description as string,
    callToAction: jsonObject.callToAction as string,
    size: jsonObject.size as { width: number; height: number; label: string },
  };
};

export const convertJsonArrayToAdVariants = (json: Json): AdVariant[] => {
  if (!Array.isArray(json)) return [];
  
  return json
    .map(item => convertJsonToAdVariant(item))
    .filter((item): item is AdVariant => item !== null);
};