
export interface LandingPageContentProps {
  project: any;
  landingPage: any;
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
  theme?: any;
}

export interface SectionContentMap {
  hero?: SectionContent;
  value_proposition?: SectionContent;
  features?: SectionContent;
  proof?: SectionContent;
  pricing?: SectionContent;
  finalCta?: SectionContent;
  footer?: SectionContent;
  [key: string]: SectionContent | undefined;
}

export interface SectionComponentsMap {
  [key: string]: React.ComponentType<any>;
}
