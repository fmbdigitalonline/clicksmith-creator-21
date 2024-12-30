export type BusinessIdea = {
  description: string;
  valueProposition: string;
};

export type TargetAudience = {
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
};

export type AdHook = {
  text: string;
  description: string;
};

export type AdFormat = {
  format?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  aspectRatio?: string;
  description?: string;
  platform?: 'facebook' | 'google' | 'linkedin' | 'tiktok';
  formats?: string[];
  commonSizes?: Array<{
    width: number;
    height: number;
    label: string;
  }>;
};

export type MarketingCampaign = {
  angles: Array<{
    description: string;
    hook: string;
  }>;
  adCopies: Array<{
    type: 'story' | 'short' | 'aida';
    content: string;
  }>;
  headlines: string[];
};

export type AdImage = {
  url: string;
  prompt: string;
};

export type Step = "idea" | "audience" | "analysis" | "campaign" | "format" | "size" | "hook" | "complete";