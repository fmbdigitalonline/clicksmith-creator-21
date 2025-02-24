
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

export interface LandingPageSection {
  type: string;
  content: any;
  layout?: {
    width?: 'contained' | 'narrow' | 'full';
    spacing?: 'compact' | 'normal' | 'spacious';
    style?: 'split' | 'columns' | 'grid';
    background?: 'plain' | 'gradient';
  };
  style?: {
    colorScheme?: 'light' | 'dark';
    typography?: {
      headingSize?: 'normal' | 'large' | 'xlarge';
    };
  };
}

export interface LandingPageContent {
  sections: LandingPageSection[];
  theme?: ThemeSettings;
}

