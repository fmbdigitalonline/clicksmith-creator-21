
export const generateInitialContent = (project: any) => {
  const businessIdea = project?.business_idea || {};
  const audienceAnalysis = project?.audience_analysis || {};
  const savedImages = project?.marketing_campaign?.saved_images || [];

  return {
    hero: {
      content: {
        title: businessIdea?.valueProposition || project.title || "Welcome to Our Platform",
        subtitle: businessIdea?.valueProposition || project.title || "Welcome",
        description: businessIdea?.description || "Discover the best solution for your needs",
        cta: "Get Started Now",
        image: savedImages[0] || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
      },
      layout: "centered"
    },
    value_proposition: {
      content: {
        title: "Why Choose Us",
        subtitle: "We deliver comprehensive solutions that drive real results",
        items: audienceAnalysis?.benefits?.map((benefit: string) => ({
          title: benefit.split(':')[0] || benefit,
          description: benefit.split(':')[1] || benefit,
          icon: "✨"
        })) || [
          {
            title: "Quality Product",
            description: "Experience superior quality in every aspect of our service",
            icon: "✨"
          },
          {
            title: "Expert Service",
            description: "Professional support available 24/7 when you need it most",
            icon: "🎯"
          },
          {
            title: "Great Value",
            description: "Competitive pricing with premium features included",
            icon: "💫"
          }
        ]
      },
      layout: "grid"
    },
    features: {
      content: {
        title: "Key Features",
        subtitle: "Everything you need to succeed",
        items: audienceAnalysis?.keyFeatures?.map((feature: string, index: number) => ({
          title: feature.split(':')[0] || feature,
          description: feature.split(':')[1] || feature,
          icon: "🎯",
          image: savedImages[index % savedImages.length] || undefined
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
        ]
      },
      layout: "grid"
    },
    proof: {
      content: {
        title: "Client Testimonials",
        subtitle: "Success stories from businesses like yours",
        testimonials: [
          {
            quote: "This platform has revolutionized our operations!",
            author: "Sarah Chen",
            role: "Marketing Director",
            company: "Growth Dynamics"
          }
        ]
      },
      layout: "grid"
    },
    pricing: {
      content: {
        title: "Simple Pricing",
        subtitle: "Choose the plan that's right for you",
        plans: [
          {
            name: "Starter",
            price: "Free",
            features: ["Basic features", "Community support", "1 project"]
          },
          {
            name: "Pro",
            price: "$49/mo",
            features: ["All features", "Priority support", "Unlimited projects"]
          }
        ]
      },
      layout: "grid"
    },
    finalCta: {
      content: {
        title: "Ready to Transform Your Business?",
        description: "Join thousands of satisfied customers today.",
        buttonText: "Get Started Now"
      },
      layout: "centered"
    },
    footer: {
      content: {
        companyName: project.name || project.title || "Our Company",
        description: businessIdea?.description || "Making your business better",
        links: {
          company: ["About", "Contact", "Careers"],
          resources: ["Blog", "Help Center", "Support"]
        }
      },
      layout: "grid"
    }
  };
};
