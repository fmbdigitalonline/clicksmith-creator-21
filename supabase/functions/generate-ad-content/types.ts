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

export interface MarketingCampaign {
  hooks: MarketingHook[];
  specs?: {
    facebook?: {
      formats?: string[];
      aspectRatios?: string[];
    };
    linkedin?: {
      formats?: string[];
      aspectRatios?: string[];
    };
    tiktok?: {
      formats?: string[];
      aspectRatios?: string[];
    };
  };
}