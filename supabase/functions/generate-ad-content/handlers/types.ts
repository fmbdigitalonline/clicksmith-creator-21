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

export interface MarketingCampaign {
  hooks: MarketingHook[];
  format: AdFormat;
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