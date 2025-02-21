
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
