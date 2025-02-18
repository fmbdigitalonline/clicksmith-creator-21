
export interface LandingPageContentProps {
  project: any;
  landingPage: any;
}

export interface SectionContent {
  content: {
    title?: string;
    description?: string;
    cta?: string;
    buttonText?: string;
    image?: string;
    cards?: Array<{
      title: string;
      description: string;
      icon?: string;
    }>;
    items?: Array<{
      title: string;
      description: string;
      icon?: string;
      image?: string;
    }>;
    links?: {
      company: string[];
      resources: string[];
    };
    copyright?: string;
  };
  layout: "centered" | "grid";
}

export interface SectionContentMap {
  [key: string]: SectionContent;
}

export interface LandingPageTemplate {
  id: string;
  name: string;
  description: string;
  structure: {
    sections: {
      [key: string]: {
        type: string;
        components: string[];
        layout?: string;
        cardsPerRow?: number;
      };
    };
    styles: {
      colorScheme: string;
      typography: {
        headingFont: string;
        bodyFont: string;
      };
      spacing: {
        sectionPadding: string;
        componentGap: string;
      };
    };
  };
}
