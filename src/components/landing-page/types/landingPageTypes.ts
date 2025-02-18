
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
}

export interface SectionContentMap {
  hero?: SectionContent;
  value_proposition?: SectionContent;
  features?: SectionContent;
  proof?: SectionContent;  // Changed from testimonials to proof
  pricing?: SectionContent;  // Changed from pricing_section to pricing
  finalCta?: SectionContent;  // Changed from cta to finalCta
  footer?: SectionContent;
  [key: string]: SectionContent | undefined;
}

export interface SectionComponentsMap {
  [key: string]: React.ComponentType<any>;
}

