
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
    image?: string;
  };
  howItWorks?: {
    subheadline: string;
    steps: Array<{
      title: string;
      description: string;
    }>;
    valueReinforcement: string;
  };
  marketAnalysis?: {
    context: string;
    solution: string;
    painPoints: Array<{
      title: string;
      description: string;
    }>;
    features: Array<{
      title: string;
      description: string;
    }>;
    socialProof: {
      quote: string;
      author: string;
      title: string;
    };
  };
  objections?: {
    subheadline: string;
    concerns: Array<{
      question: string;
      answer: string;
    }>;
  };
  faq?: {
    subheadline: string;
    questions: Array<{
      question: string;
      answer: string;
    }>;
  };
  footerContent?: {
    contact: string;
    newsletter: string;
    copyright: string;
  };
}
