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

export type GoogleAdFormat = {
  type: 'app' | 'demand-gen' | 'responsive-display' | 'performance-max';
  text: {
    headlines: string[];
    descriptions: string[];
    businessName?: string;
    callToAction?: string;
    finalUrl?: string;
    longHeadlines?: string[];
  };
  images: {
    horizontal?: AdImage[];
    vertical?: AdImage[];
    square?: AdImage[];
    logo?: AdImage[];
    logoAlternative?: AdImage[];
  };
  videos?: {
    horizontal?: string[];
    vertical?: string[];
    square?: string[];
  };
};

export type GoogleAdSpecs = {
  appCampaign: {
    text: {
      headlines: { min: 1; max: 5; charLimit: 30; recommended: 5 };
      descriptions: { min: 1; max: 5; charLimit: 90; recommended: 5 };
    };
    images: {
      horizontal: { ratio: '1.91:1'; width: 1200; height: 628; minQuantity: 1; maxQuantity: 20 };
      vertical: { ratio: '4:5'; width: 1200; height: 1500; minQuantity: 1; maxQuantity: 20 };
      square: { ratio: '1:1'; width: 1200; height: 1200; minQuantity: 1; maxQuantity: 20 };
    };
  };
  demandGen: {
    text: {
      finalUrl: { charLimit: 2048; required: true };
      businessName: { charLimit: 25; required: true };
      callToAction: { required: true };
      headlines: { min: 1; max: 5; charLimit: 40; recommended: 5 };
      descriptions: { min: 1; max: 5; charLimit: 90; recommended: 3 };
    };
    images: {
      horizontal: { ratio: '1.91:1'; width: 1200; height: 628; minQuantity: 1; maxQuantity: 20; recommended: 3 };
      logo: { ratio: '1:1'; width: 1200; height: 1200; minQuantity: 1; maxQuantity: 5; recommended: 1 };
      square: { ratio: '1:1'; width: 1200; height: 1200; minQuantity: 1; maxQuantity: 20; recommended: 3 };
      vertical: { ratio: '4:5'; width: 960; height: 1200; minQuantity: 1; maxQuantity: 20; recommended: 3 };
    };
    videos: {
      horizontal: { ratio: '16:9'; length: { min: 10; max: 60 }; quantity: 3 };
      vertical: { ratio: ['9:16', '4:5']; length: { min: 10; max: 60 }; quantity: 3 };
      square: { ratio: '1:1'; length: { min: 10; max: 60 }; quantity: 3 };
    };
  };
  responsiveDisplay: {
    text: {
      headlines: { min: 1; max: 5; charLimit: 30; recommended: 5 };
      longHeadline: { charLimit: 90; required: true };
      descriptions: { min: 1; max: 5; charLimit: 90; recommended: 5 };
      businessName: { charLimit: 25; required: true };
      callToAction: { required: true };
    };
    images: {
      horizontal: { ratio: '1.91:1'; width: 1200; height: 628; minQuantity: 1; maxQuantity: 15; recommended: 5 };
      logo: { ratio: '1:1'; width: 1200; height: 1200; minQuantity: 1; maxQuantity: 5; recommended: 1 };
      logoAlternative: { ratio: '4:1'; width: 1200; height: 300; minQuantity: 1; maxQuantity: 5; recommended: 1 };
      square: { ratio: '1:1'; width: 600; height: 600; minQuantity: 1; maxQuantity: 15; recommended: 5 };
    };
    videos: {
      horizontal: { ratio: '16:9'; preferredLength: 30; minQuantity: 1; maxQuantity: 5; recommended: 2 };
      square: { ratio: '1:1'; preferredLength: 30; minQuantity: 1; maxQuantity: 5; recommended: 2 };
      vertical: { ratio: '2:3'; preferredLength: 30; minQuantity: 1; maxQuantity: 5; recommended: 2 };
    };
  };
  performanceMax: {
    text: {
      headlines: { min: 3; max: 15; charLimit: 30; recommended: 11 };
      longHeadlines: { min: 1; max: 5; charLimit: 90; recommended: 2 };
      descriptions: { min: 1; max: 5; charLimit: 90; recommended: 4 };
      businessName: { charLimit: 25; required: true };
      callToAction: { required: true };
      finalUrl: { charLimit: 2048; required: true };
    };
    images: {
      horizontal: { ratio: '1.91:1'; width: 1200; height: 628; minQuantity: 1; maxQuantity: 20; recommended: 4 };
      square: { ratio: '1:1'; width: 1200; height: 1200; minQuantity: 1; maxQuantity: 20; recommended: 4 };
      logo: { ratio: '1:1'; width: 1200; height: 1200; minQuantity: 1; maxQuantity: 5; recommended: 1 };
      logoAlternative: { ratio: '4:1'; width: 1200; height: 300; minQuantity: 1; maxQuantity: 5 };
      vertical: { ratio: '4:5'; width: 960; height: 1200; minQuantity: 1; maxQuantity: 20 };
    };
    videos: {
      horizontal: { ratio: '16:9'; minLength: 10; minQuantity: 1; maxQuantity: 5 };
      square: { ratio: '1:1'; minLength: 10; minQuantity: 1; maxQuantity: 5 };
      vertical: { ratio: '9:16'; minLength: 10; minQuantity: 1; maxQuantity: 5 };
    };
  };
};