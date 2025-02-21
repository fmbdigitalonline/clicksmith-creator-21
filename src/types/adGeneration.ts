import { Json } from "@/integrations/supabase/types";

export type Platform = 'facebook' | 'google' | 'linkedin' | 'tiktok';

export interface AdSize {
  width: number;
  height: number;
  label: string;
}

export interface AdVariant {
  id: string;
  platform: Platform;
  imageUrl: string;
  headline: string;
  description: string;
  size: AdSize;
  resizedUrls?: Record<string, string>;
}

export interface PlatformAdState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  variants: AdVariant[];
}

export interface AdGenerationState {
  isInitialLoad: boolean;
  hasSavedAds: boolean;
  platformSpecificAds: Record<Platform, PlatformAdState>;
}

export interface DatabaseAdVariant {
  id: string;
  platform: string;
  imageUrl: string;
  headline: string;
  description: string;
  size: {
    width: number;
    height: number;
    label: string;
  };
  resizedUrls?: Record<string, string>;
}

// Type guards and conversion utilities
export const isValidSize = (value: unknown): value is AdSize => {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj?.width === 'number' &&
    typeof obj?.height === 'number' &&
    typeof obj?.label === 'string'
  );
};

export const isValidAdVariant = (data: unknown): data is AdVariant => {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return Boolean(
    obj &&
    typeof obj?.id === 'string' &&
    typeof obj?.platform === 'string' &&
    typeof obj?.imageUrl === 'string' &&
    typeof obj?.headline === 'string' &&
    typeof obj?.description === 'string' &&
    obj?.size && isValidSize(obj.size)
  );
};

export const convertToAdVariant = (data: DatabaseAdVariant | unknown): AdVariant | null => {
  if (!data || typeof data !== 'object') return null;
  
  try {
    const obj = data as Record<string, unknown>;
    const sizeObj = obj?.size as Record<string, unknown>;

    if (!sizeObj) return null;

    const variant: AdVariant = {
      id: String(obj?.id || ''),
      platform: String(obj?.platform || 'facebook') as Platform,
      imageUrl: String(obj?.imageUrl || ''),
      headline: String(obj?.headline || ''),
      description: String(obj?.description || ''),
      size: {
        width: Number(sizeObj?.width || 0),
        height: Number(sizeObj?.height || 0),
        label: String(sizeObj?.label || '')
      }
    };
    
    if (obj?.resizedUrls && typeof obj.resizedUrls === 'object') {
      variant.resizedUrls = obj.resizedUrls as Record<string, string>;
    }
    
    return isValidAdVariant(variant) ? variant : null;
  } catch {
    return null;
  }
};

export const convertToDatabaseFormat = (variant: AdVariant): DatabaseAdVariant => {
  return {
    id: variant.id,
    platform: variant.platform,
    imageUrl: variant.imageUrl,
    headline: variant.headline,
    description: variant.description,
    size: {
      width: variant.size.width,
      height: variant.size.height,
      label: variant.size.label
    },
    resizedUrls: variant.resizedUrls || {}
  };
};
