
export interface AdVariant {
  id: string;
  platform: string;
  imageUrl: string;
  headline: string;
  description: string;
  size?: {
    width: number;
    height: number;
    label: string;
  };
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
  platformSpecificAds: Record<string, PlatformAdState>;
}
