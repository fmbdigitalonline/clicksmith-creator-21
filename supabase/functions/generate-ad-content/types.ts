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

export interface MarketingHook {
  text: string;
  description: string;
}

export interface AdFormat {
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
  aspectRatio: string;
  description: string;
  platform: 'facebook' | 'google';
}

export interface GoogleAdFormat {
  type: 'app' | 'demand-gen' | 'responsive-display' | 'performance-max';
  text: {
    headlines: string[];
    descriptions: string[];
    businessName?: string;
    callToAction?: string;
    finalUrl?: string;
    longHeadlines?: string[];
  };
  images: {
    horizontal?: AdImage[];
    vertical?: AdImage[];
    square?: AdImage[];
    logo?: AdImage[];
    logoAlternative?: AdImage[];
  };
  videos?: {
    horizontal?: string[];
    vertical?: string[];
    square?: string[];
  };
}

export interface AdImage {
  url: string;
  prompt: string;
}