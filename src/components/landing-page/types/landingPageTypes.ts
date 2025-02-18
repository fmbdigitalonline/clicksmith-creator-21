
export interface LandingPageContentProps {
  project: {
    id: string;
    title: string;
    name?: string;
    business_idea: {
      description: string;
      valueProposition?: string;
    };
    target_audience?: {
      description?: string;
      name?: string;
      painPoints?: string[];
      demographics?: string;
      marketingAngle?: string;
    };
    audience_analysis?: {
      marketDesire?: string;
      awarenessLevel?: string;
      deepPainPoints?: string[];
      expandedDefinition?: string;
    };
    marketing_campaign?: any;
    selected_hooks?: string[];
    generated_ads?: any[];
  };
  landingPage?: {
    id: string;
    content?: Record<string, any>;
    layout_style?: any;
    section_order?: string[];
  };
}

export interface SectionContent {
  content: {
    title?: string;
    description?: string;
    cta?: string;
    image?: string;
    cards?: any[];
    items?: any[];
    [key: string]: any;
  };
  layout: string;
}

export interface SectionContentMap {
  [key: string]: SectionContent;
}
