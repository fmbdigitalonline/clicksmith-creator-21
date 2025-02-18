
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
  [key: string]: SectionContent;
}

export interface SectionComponentsMap {
  [key: string]: React.ComponentType<any>;
}
