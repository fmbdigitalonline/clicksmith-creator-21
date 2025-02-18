
import type { SectionContentMap } from "../types/landingPageTypes";

export const generateInitialContent = (project: any): SectionContentMap => {
  const businessIdea = project?.business_idea || {};
  const audienceAnalysis = project?.audience_analysis || {};
  const savedImages = project?.marketing_campaign?.saved_images || [];

  const defaultCards = [
    {
      icon: "✨",
      title: "Quality Product",
      description: "Experience superior quality in every aspect of our service"
    },
    {
      icon: "🎯",
      title: "Expert Service",
      description: "Professional support available 24/7 when you need it most"
    },
    {
      icon: "💫",
      title: "Great Value",
      description: "Competitive pricing with premium features included"
    }
  ];

  const defaultFeatures = [
    {
      title: "Intuitive Platform",
      description: "Our user-friendly interface ensures you can get started immediately",
      icon: "🎯"
    },
    {
      title: "Advanced Analytics",
      description: "Get detailed insights into your performance",
      icon: "📊"
    }
  ];

  const cards = Array.isArray(audienceAnalysis?.benefits) 
    ? audienceAnalysis.benefits.map((benefit: string) => ({
        icon: "✨",
        title: benefit.split(':')[0] || benefit,
        description: benefit.split(':')[1] || benefit,
      }))
    : defaultCards;

  const features = Array.isArray(audienceAnalysis?.keyFeatures)
    ? audienceAnalysis.keyFeatures.map((feature: string, index: number) => ({
        title: feature.split(':')[0] || feature,
        description: feature.split(':')[1] || feature,
        icon: "🎯",
        image: savedImages[index % savedImages.length] || ""
      }))
    : defaultFeatures;

  return {
    hero: {
      content: {
        title: businessIdea?.valueProposition || project?.title || "Welcome to Our Platform",
        description: businessIdea?.description || "Discover the best solution for your needs",
        cta: "Get Started Now",
        image: savedImages[0] || ""
      },
      layout: "centered" as const
    },
    value_proposition: {
      content: {
        title: "Why Choose Us?",
        description: "We deliver comprehensive solutions that drive real results",
        cards
      },
      layout: "grid" as const
    },
    features: {
      content: {
        title: "Powerful Features",
        description: "Everything you need to succeed",
        items: features
      },
      layout: "grid" as const
    },
    testimonials: {
      content: {
        title: "What Our Clients Say",
        items: []
      },
      layout: "grid" as const
    },
    pricing: {
      content: {
        title: "Pricing",
        description: "Choose the plan that works for you",
        items: []
      },
      layout: "grid" as const
    },
    cta: {
      content: {
        title: "Ready to Transform Your Business?",
        description: "Join thousands of satisfied customers today.",
        buttonText: "Get Started Now"
      },
      layout: "centered" as const
    },
    footer: {
      content: {
        links: {
          company: ["About", "Contact"],
          resources: ["Documentation", "Support"]
        },
        copyright: `© ${new Date().getFullYear()} All rights reserved.`
      },
      layout: "grid" as const
    }
  };
};
