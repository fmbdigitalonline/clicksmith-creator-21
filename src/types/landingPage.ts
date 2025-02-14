
export interface LandingPageTemplate {
  id: string;
  name: string;
  description: string;
  structure: {
    sections: {
      hero: {
        type: string;
        components: string[];
        layout: string;
      };
      valueProposition: {
        type: string;
        components: string[];
        cardsPerRow: number;
      };
      features: {
        type: string;
        components: string[];
        cardsPerRow: number;
      };
      proof: {
        type: string;
        components: string[];
      };
      pricing: {
        type: string;
        components: string[];
        cardsPerRow: number;
      };
      finalCta: {
        type: string;
        components: string[];
      };
      footer: {
        type: string;
        components: string[];
        columns: number;
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

export interface LandingPageContent {
  hero?: {
    title: string;
    description: string;
    cta: string;
  };
  valueProposition?: {
    title: string;
    cards: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  features?: {
    title: string;
    items: Array<{
      title: string;
      description: string;
      image?: string;
    }>;
  };
  proof?: {
    testimonials?: Array<{
      quote: string;
      author: string;
      role?: string;
      image?: string;
    }>;
    statistics?: Array<{
      value: string;
      label: string;
      icon?: string;
    }>;
    trustBadges?: string[];
  };
  pricing?: {
    title: string;
    plans: Array<{
      name: string;
      price: string;
      features: string[];
      cta: string;
      highlighted?: boolean;
    }>;
  };
  finalCta?: {
    title: string;
    subtitle: string;
    buttonText: string;
  };
}
