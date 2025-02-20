
import HeroSection from "../sections/HeroSection";
import ValuePropositionSection from "../sections/ValuePropositionSection";
import FeaturesSection from "../sections/FeaturesSection";
import TestimonialsSection from "../sections/TestimonialsSection";
import CtaSection from "../sections/CtaSection";
import FooterSection from "../sections/FooterSection";
import PricingSection from "../sections/PricingSection";

export const sectionComponents = {
  hero: HeroSection,
  value_proposition: ValuePropositionSection,
  features: FeaturesSection,
  proof: TestimonialsSection,
  pricing: PricingSection,
  finalCta: CtaSection,
  footer: FooterSection,
} as const;

export const defaultSectionOrder = [
  "hero",
  "value_proposition",
  "features",
  "proof",
  "pricing",
  "finalCta",
  "footer"
];
