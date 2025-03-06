
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
  audienceAnalysis?: AudienceAnalysis;
};

export type AudienceAnalysis = {
  expandedDefinition: string;
  marketDesire: string;
  awarenessLevel: string;
  sophisticationLevel: string;
  deepPainPoints: string[];
  potentialObjections: string[];
};

export type AdHook = {
  text: string;
  description: string;
};

export type AdFormat = {
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
  aspectRatio: string;
  description: string;
  platform: 'facebook' | 'google';
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

// Type for the project structure in the database
export type Project = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description?: string;
  status?: string;
  current_step?: number;
  business_idea?: BusinessIdea;
  target_audience?: TargetAudience;
  audience_analysis?: AudienceAnalysis;
  marketing_campaign?: MarketingCampaign;
  selected_hooks?: AdHook[];
  generated_ads?: any[];
  tags?: string[];
  ad_format?: string;
  ad_dimensions?: { width: number; height: number };
  format_preferences?: string[];
  video_ads_enabled?: boolean;
  video_ad_settings?: { format: string; duration: number };
  video_ad_preferences?: { format: string; duration: number };
};
