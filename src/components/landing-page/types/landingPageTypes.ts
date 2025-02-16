
export interface LandingPageContentProps {
  project: any;
  landingPage: any;
}

export interface SectionContentMap {
  [key: string]: {
    content: any;
    layout: string; // Remove the optional '?' since layout is required for hero section
  };
}

export interface SectionComponentsMap {
  [key: string]: React.ComponentType<any>;
}
