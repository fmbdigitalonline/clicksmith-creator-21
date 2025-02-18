
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
    testimonials?: Array<{
      quote: string;
      author: string;
      role?: string;
      company?: string;
    }>;
    pricingTiers?: Array<{
      name: string;
      price: string;
      features: string[];
      cta?: string;
    }>;
    faqItems?: Array<{
      question: string;
      answer: string;
    }>;
    [key: string]: any;
  };
  layout: "centered" | "grid" | "split";
}

export interface SectionContentMap {
  [key: string]: SectionContent;
}

export interface SectionComponentsMap {
  [key: string]: React.ComponentType<any>;
}

export interface AIDAContent {
  hero: {
    headline: string;
    subheadline: string;
    cta: string;
    image?: string;
  };
  valueProposition: {
    title: string;
    description: string;
    benefits: Array<{
      title: string;
      description: string;
    }>;
  };
  features: {
    title: string;
    description: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  };
  testimonials: {
    title: string;
    items: Array<{
      quote: string;
      author: string;
      role?: string;
      company?: string;
    }>;
  };
  pricing?: {
    title: string;
    description: string;
    tiers: Array<{
      name: string;
      price: string;
      features: string[];
      cta?: string;
    }>;
  };
  faq?: {
    title: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  };
}
