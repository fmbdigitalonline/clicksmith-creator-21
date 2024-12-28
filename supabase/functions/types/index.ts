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