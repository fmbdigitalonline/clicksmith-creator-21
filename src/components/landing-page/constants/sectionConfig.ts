
import HeroSection from "../sections/HeroSection";
import ValuePropositionSection from "../sections/ValuePropositionSection";
import FeaturesSection from "../sections/FeaturesSection";
import TestimonialsSection from "../sections/TestimonialsSection";
import CtaSection from "../sections/CtaSection";
import FooterSection from "../sections/FooterSection";
import PricingSection from "../sections/PricingSection";

// Map section keys to their corresponding components
export const sectionComponents = {
  hero: HeroSection,
  value_proposition: ValuePropositionSection,
  features: FeaturesSection,
  testimonials: TestimonialsSection,
  pricing: PricingSection,
  cta: CtaSection,
  footer: FooterSection,
} as const;

// Default section order
export const defaultSectionOrder = [
  "hero",
  "value_proposition",
  "features",
  "testimonials",
  "pricing",
  "cta",
  "footer"
];
