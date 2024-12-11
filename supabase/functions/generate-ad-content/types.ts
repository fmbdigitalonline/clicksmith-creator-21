export interface BusinessIdea {
  name: string;
  description: string;
  industry?: string;
}

export interface TargetAudience {
  description: string;
  demographics?: {
    age?: string;
    gender?: string;
    location?: string;
  };
  interests?: string[];
}

export interface MarketingCampaign {
  objective?: string;
  hooks?: Array<{
    text: string;
    type: string;
  }>;
  format?: {
    type: string;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}