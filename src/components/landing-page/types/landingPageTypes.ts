
export interface LandingPageContentProps {
  project: any;
  landingPage: any;
}

export interface SectionContentMap {
  [key: string]: {
    content: any;
    layout?: string;
  };
}

export interface SectionComponentsMap {
  [key: string]: React.ComponentType<any>;
}
