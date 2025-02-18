
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
  proof: TestimonialsSection, // Map 'proof' to TestimonialsSection
  testimonials: TestimonialsSection, // Keep this for backward compatibility
  pricing: PricingSection,
  cta: CtaSection,
  finalCta: CtaSection, // Map 'finalCta' to CtaSection
  footer: FooterSection,
} as const;

// Default section order - updated to match expected structure
export const defaultSectionOrder = [
  "hero",
  "value_proposition",
  "features",
  "proof", // Changed from testimonials to proof
  "pricing",
  "finalCta", // Changed from cta to finalCta
  "footer"
];
