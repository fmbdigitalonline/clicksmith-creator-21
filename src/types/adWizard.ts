export interface BusinessIdea {
  name: string;
  description: string;
  valueProposition: string;
  uniqueSellingPoints: string[];
  targetMarket?: string;
  industry?: string;
  competitors?: string[];
  pricePoint?: string;
}

export interface TargetAudience {
  name: string;
  description: string;
  demographics: {
    ageRange: string;
    gender: string;
    location: string;
    income?: string;
    education?: string;
    occupation?: string;
  };
  interests: string[];
  behaviors: string[];
  painPoints: string[];
  goals: string[];
  audienceSize?: string;
  icp: string;
  coreMessage: string;
  positioning: string;
  marketingAngle: string;
  messagingApproach: string;
  marketingChannels: string[];
}

export interface AdHook {
  id: string;
  description: string;
  text: string;
  type?: string;
  emotionalTriggers?: string[];
  targetPainPoints?: string[];
}

export interface AdFormat {
  type: string;
  platform: string;
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
  aspectRatio: string;
  description: string;
}

export interface AdImage {
  url: string;
  prompt?: string;
  variantId?: string;
  variants?: Record<string, string>;
}

export interface AudienceAnalysis {
  expandedDefinition: string;
  marketDesire: string;
  awarenessLevel: string;
  sophisticationLevel: string;
  deepPainPoints: string[];
  potentialObjections: string[];
}

export interface MarketingCampaign {
  angles: Array<{
    description: string;
    hook: string;
  }>;
  adCopies: Array<{
    type: string;
    content: string;
  }>;
  headlines: string[];
}

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface SavedAd {
  image: AdImage;
  hook: AdHook;
  rating: number;
  feedback: string;
  savedAt: string;
}

export interface SavedAdJson {
  image: Json;
  hook: Json;
  rating: Json;
  feedback: Json;
  savedAt: Json;
}