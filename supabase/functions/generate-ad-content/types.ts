export interface BusinessIdea {
  description: string;
  valueProposition: string;
}

export interface TargetAudience {
  name: string;
  description: string;
}

export interface AdHook {
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
}

export interface MarketingCampaign {
  hooks: AdHook[];
  format: AdFormat;
}