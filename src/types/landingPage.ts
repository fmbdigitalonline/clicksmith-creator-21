
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
    styles: ThemeSettings;
  };
}

export interface ThemeSettings {
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    scale: {
      h1: string;
      h2: string;
      h3: string;
      body: string;
      small: string;
    };
  };
  spacing: {
    sectionPadding: string;
    componentGap: string;
    containerWidth: string;
  };
  style: {
    borderRadius: string;
    shadowStrength: 'none' | 'light' | 'medium' | 'strong';
    containerStyle: 'contained' | 'wide' | 'full';
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
  theme?: ThemeSettings;
}

