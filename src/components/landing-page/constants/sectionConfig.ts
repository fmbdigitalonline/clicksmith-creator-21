
import HeroSection from "../sections/HeroSection";
import ValuePropositionSection from "../sections/ValuePropositionSection";
import FeaturesSection from "../sections/FeaturesSection";
import TestimonialsSection from "../sections/TestimonialsSection";
import PricingSection from "../sections/PricingSection";
import CtaSection from "../sections/CtaSection";
import HowItWorksSection from "../sections/HowItWorksSection";
import MarketAnalysisSection from "../sections/MarketAnalysisSection";
import ObjectionsSection from "../sections/ObjectionsSection";
import FaqSection from "../sections/FaqSection";
import FooterSection from "../sections/FooterSection";

// Map section keys to their corresponding components
export const sectionComponents = {
  hero: HeroSection,
  value_proposition: ValuePropositionSection,
  features: FeaturesSection,
  proof: TestimonialsSection, // Map 'proof' to TestimonialsSection
  testimonials: TestimonialsSection,
  pricing: PricingSection,
  cta: CtaSection,
  finalCta: CtaSection, // Map 'finalCta' to CtaSection
  how_it_works: HowItWorksSection,
  market_analysis: MarketAnalysisSection,
  objections: ObjectionsSection,
  faq: FaqSection,
  footer: FooterSection,
} as const;

// Default section order if none is provided
export const defaultSectionOrder = [
  "hero",
  "value_proposition",
  "features",
  "proof",
  "pricing",
  "finalCta",
  "footer"
];
