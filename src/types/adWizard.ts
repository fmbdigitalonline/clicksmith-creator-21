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
  audienceAnalysis?: {
    deepPainPoints?: string[];
    motivations?: string[];
    objections?: string[];
    buyingStage?: string;
  };
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
  platform: string;
  type: string;
  dimensions?: {
    width: number;
    height: number;
  };
  specifications?: {
    maxLength?: number;
    fileType?: string[];
    requirements?: string[];
  };
}

export interface AdImage {
  url: string;
  prompt?: string;
  variantId?: string;
  variants?: Record<string, string>;
}

export interface GoogleAdFormat {
  headline: string;
  description: string;
  imageUrl?: string;
  callToAction?: string;
  size?: {
    width: number;
    height: number;
    label: string;
  };
  specs?: {
    designRecommendations?: {
      fileTypes: string[];
      aspectRatios: string;
    };
    textRecommendations?: {
      primaryTextLength: string;
      headlineLength: string;
    };
  };
}