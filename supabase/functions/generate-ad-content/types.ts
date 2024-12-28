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
  hooks: AdHook[];
  format: AdFormat;
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
  platform: 'facebook' | 'google';
}

export interface AdSize {
  width: number;
  height: number;
  label: string;
}

export interface AdSpecs {
  uploadedAdSpecs: {
    maxFileSizeKB: number;
    acceptedFormats: string[];
    commonSizes: AdSize[];
    mobileCommonSizes: AdSize[];
    topPerforming: AdSize[];
  };
  responsiveAdSpecs: {
    recommendedAspectRatios: {
      square: string;
      landscape: string;
    };
    minimumImageWidth: number;
    responsiveRenderedSizes: {
      desktop: AdSize[];
      mobile: AdSize[];
    };
  };
}