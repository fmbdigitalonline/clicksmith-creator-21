export interface BusinessIdea {
  description: string;
  valueProposition: string;
}

export interface TargetAudience {
  name: string;
  description: string;
  demographics: string;
  painPoints: string[];
  icp: string;
  coreMessage: string;
  positioning: string;
  marketingAngle: string;
  messagingApproach: string;
  marketingChannels: string[];
}

export interface AdHook {
  text: string;
  description: string;
}

export interface AdSize {
  width: number;
  height: number;
  label: string;
}

export interface AdFormat {
  format?: string;
  formats?: string[];
  dimensions?: {
    width: number;
    height: number;
  };
  aspectRatio?: string;
  aspectRatios?: string[];
  description?: string;
  platform?: 'facebook' | 'google';
  commonSizes?: AdSize[];
}

export interface PlatformSpecs {
  facebook: AdFormat;
  google: AdFormat;
  linkedin: AdFormat;
  tiktok: AdFormat;
}