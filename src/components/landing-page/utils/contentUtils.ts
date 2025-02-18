
import type { SectionContentMap } from "../types/landingPageTypes";

export const generateInitialContent = (project: any): SectionContentMap => {
  const businessIdea = project?.business_idea || {};
  const audienceAnalysis = project?.audience_analysis || {};
  const targetAudience = project?.target_audience || {};
  const savedImages = project?.marketing_campaign?.saved_images || [];

  const painPoints = targetAudience?.painPoints || [];
  const marketingChannels = targetAudience?.marketingChannels || [];

  // Map pain points to value proposition cards
  const cards = painPoints.map((point: string) => ({
    icon: "✨",
    title: "Solution",
    description: point
  })) || [
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

  // Map marketing channels to features
  const features = marketingChannels.map((channel: string) => ({
    title: channel,
    description: `Reach your audience effectively on ${channel}`,
    icon: "🎯"
  })) || [
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

  return {
    hero: {
      content: {
        title: businessIdea?.valueProposition || "Transform Your Business Ideas into Reality",
        description: businessIdea?.description || "Get the professional guidance you need to succeed",
        cta: "Get Started Now",
        image: savedImages[0] || ""
      },
      layout: "centered" as const
    },
    value_proposition: {
      content: {
        title: "Why Choose Us",
        description: targetAudience?.coreMessage || "We deliver comprehensive solutions that drive real results",
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
    proof: {
      content: {
        title: "What Our Clients Say",
        items: []
      },
      layout: "grid" as const
    },
    pricing: {
      content: {
        title: "Simple Pricing",
        description: "Choose the plan that works for you",
        items: []
      },
      layout: "grid" as const
    },
    finalCta: {
      content: {
        title: "Ready to Transform Your Business?",
        description: targetAudience?.messagingApproach || "Join thousands of satisfied customers today.",
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
