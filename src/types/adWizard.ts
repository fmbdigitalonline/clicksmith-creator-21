
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

// New types for enhanced persona system

/**
 * Represents an enhanced persona with focused information
 */
export type EnhancedPersona = {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  values: string[];
  strengths: string[];
  weaknesses: string[];
  demographics: string;
  psychographics: string;
  behavioralTraits: string[];
  goals: string[];
  challenges: string[];
  mediaPreferences: string[];
  purchaseDrivers: string[];
};

/**
 * Represents a brand archetype for persona matching
 */
export type BrandArchetype = {
  id: string;
  name: string;
  description: string;
  values: string[];
  motivations: string[];
  communicationStyle: string;
  brandVoice: string;
  examples: string[];
};

/**
 * Represents a psychological driver that influences audience behavior
 */
export type PsychologicalDriver = {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  persuasionTactics: string[];
  emotionalTouchpoints: string[];
  applicationContext: string;
};

/**
 * Represents a comprehensive audience analysis incorporating
 * archetype and psychological drivers
 */
export type EnhancedAudienceAnalysis = {
  // Archetype-related information
  selectedArchetype: {
    name: string;
    description: string;
    values: string[];
    motivations: string[];
    communicationStyle: string;
    brandVoice: string;
  };
  
  // Psychological driver information
  psychologicalDriver: {
    name: string;
    description: string;
    triggers: string[];
    persuasionTactics: string[];
    emotionalTouchpoints: string[];
  };
  
  // Combined analysis
  marketAnalysis: {
    desireMapping: string;
    painPointAnalysis: string[];
    valueAlignment: string;
    decisionFactors: string[];
  };
  
  // Behavioral insights
  behavioralInsights: {
    purchasePatterns: string;
    informationProcessing: string;
    trustFactors: string[];
    objectionPoints: string[];
  };
  
  // Communication strategy
  communicationStrategy: {
    primaryMessages: string[];
    tonalityGuide: string;
    contentPreferences: string;
    engagementTriggers: string[];
  };
};

/**
 * Enhanced Step type to include new steps in the wizard flow
 */
export type EnhancedStep = 
  | "idea" 
  | "audience" 
  | "enhancedPersona" 
  | "brandArchetype" 
  | "psychologicalDriver" 
  | "enhancedAnalysis" 
  | "analysis" 
  | "campaign" 
  | "format" 
  | "size" 
  | "hook" 
  | "complete";

/**
 * Enhanced Project structure with new fields for the extended functionality
 * This type extends the base Project type with optional new fields
 */
export type EnhancedProject = Project & {
  enhanced_persona?: EnhancedPersona;
  brand_archetype?: BrandArchetype;
  psychological_driver?: PsychologicalDriver;
  enhanced_audience_analysis?: EnhancedAudienceAnalysis;
};
