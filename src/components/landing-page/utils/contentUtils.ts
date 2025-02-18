
import type { SectionContentMap } from "../types/landingPageTypes";

export const generateInitialContent = (project: any): SectionContentMap => {
  return {
    hero: {
      content: {
        title: project.title || "Welcome",
        description: project.business_idea?.description || "",
        cta: "Get Started",
        image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
      },
      layout: "centered"
    },
    value_proposition: {
      content: {
        title: "Why Choose Us",
        cards: []
      },
      layout: "grid"
    },
    features: {
      content: {
        title: "Our Features",
        items: []
      },
      layout: "grid"
    },
    proof: {
      content: {
        title: "What Our Clients Say",
        testimonials: []
      },
      layout: "grid"
    },
    pricing: {
      content: {
        title: "Pricing Plans",
        plans: [
          {
            name: "Basic",
            price: "Free",
            features: ["Basic features"]
          },
          {
            name: "Pro",
            price: "$49/mo",
            features: ["All features"]
          }
        ]
      },
      layout: "grid"
    },
    finalCta: {
      content: {
        title: "Ready to Get Started?",
        description: "Begin your journey today",
        buttonText: "Get Started"
      },
      layout: "centered"
    },
    footer: {
      content: {
        companyName: project.title || "My Business",
        description: project.business_idea?.description || "",
        links: {
          product: ["Features", "Pricing", "Documentation"],
          company: ["About", "Blog", "Contact"],
          resources: ["Support", "Privacy", "Terms"]
        }
      },
      layout: "grid"
    }
  };
};
