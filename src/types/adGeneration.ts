
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
export const isValidAdVariant = (data: unknown): data is AdVariant => {
  if (!data || typeof data !== 'object') return false;
  
  const d = data as Record<string, unknown>;
  const size = d.size as Record<string, unknown>;
  
  return Boolean(
    d &&
    typeof d.id === 'string' &&
    typeof d.platform === 'string' &&
    typeof d.imageUrl === 'string' &&
    typeof d.headline === 'string' &&
    typeof d.description === 'string' &&
    size &&
    typeof size.width === 'number' &&
    typeof size.height === 'number' &&
    typeof size.label === 'string'
  );
};

export const convertToAdVariant = (data: unknown): AdVariant | null => {
  if (!data || typeof data !== 'object') return null;
  
  try {
    const parsed = data as Record<string, unknown>;
    const size = parsed.size as Record<string, unknown>;
    
    if (!size || typeof size !== 'object') return null;
    
    const variant: AdVariant = {
      id: String(parsed.id || ''),
      platform: String(parsed.platform || 'facebook') as Platform,
      imageUrl: String(parsed.imageUrl || ''),
      headline: String(parsed.headline || ''),
      description: String(parsed.description || ''),
      size: {
        width: Number(size.width || 0),
        height: Number(size.height || 0),
        label: String(size.label || '')
      }
    };
    
    if (parsed.resizedUrls && typeof parsed.resizedUrls === 'object') {
      variant.resizedUrls = parsed.resizedUrls as Record<string, string>;
    }
    
    return isValidAdVariant(variant) ? variant : null;
  } catch {
    return null;
  }
};

export const convertToDatabaseFormat = (variant: AdVariant): Json => {
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
  } as Json;
};
