
export const generateInitialContent = (project: any) => {
  // Ensure we have the required objects, even if empty
  const businessIdea = project?.business_idea || {};
  const audienceAnalysis = project?.audience_analysis || {};
  const savedImages = project?.marketing_campaign?.saved_images || [];

  // Default card data
  const defaultCards = [
    {
      icon: "✨",
      title: "Quality Product",
      description: "Experience superior quality in every aspect"
    },
    {
      icon: "🎯",
      title: "Expert Service",
      description: "Professional support when you need it"
    },
    {
      icon: "💫",
      title: "Great Value",
      description: "Competitive pricing for premium offerings"
    }
  ];

  // Default features with fallback images
  const defaultFeatures = [
    {
      title: "Easy to Use",
      description: "Intuitive design for the best user experience",
      image: savedImages[0] || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
      icon: "🎯"
    },
    {
      title: "Reliable Service",
      description: "Consistent performance you can count on",
      image: savedImages[1] || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
      icon: "🎯"
    },
    {
      title: "Fast Support",
      description: "Quick assistance whenever you need help",
      image: savedImages[2] || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
      icon: "🎯"
    }
  ];

  return {
    hero: {
      title: businessIdea?.valueProposition || project.title || "Welcome to Our Platform",
      description: businessIdea?.description || "Discover the best solution for your needs",
      cta: "Get Started Now",
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
    },
    howItWorks: {
      subheadline: "How It Works",
      steps: [
        {
          title: "Step 1",
          description: "Get started with our easy onboarding process"
        },
        {
          title: "Step 2",
          description: "Customize your experience to match your needs"
        },
        {
          title: "Step 3",
          description: "Enjoy the benefits of our solution"
        }
      ],
      valueReinforcement: "Start your journey with us today"
    },
    marketAnalysis: {
      context: "Understanding the Market",
      solution: "Our Innovative Solution",
      painPoints: [
        {
          title: "Challenge 1",
          description: "Common industry pain point"
        },
        {
          title: "Challenge 2",
          description: "Another market challenge"
        }
      ],
      features: Array.isArray(audienceAnalysis?.keyFeatures)
        ? audienceAnalysis.keyFeatures.map((feature: string, index: number) => ({
            title: feature.split(':')[0] || feature,
            description: feature.split(':')[1] || feature,
            image: savedImages[index % savedImages.length] || defaultFeatures[index % defaultFeatures.length].image
          }))
        : defaultFeatures,
      socialProof: {
        quote: "This solution has transformed our business operations",
        author: "John Smith",
        title: "CEO, Tech Company"
      }
    },
    valueProposition: {
      title: "Why Choose Us?",
      cards: Array.isArray(audienceAnalysis?.benefits) 
        ? audienceAnalysis.benefits.map((benefit: string) => ({
            icon: "✨",
            title: benefit.split(':')[0] || benefit,
            description: benefit.split(':')[1] || benefit,
          }))
        : defaultCards,
    },
    features: {
      title: "Key Features",
      description: "Discover what makes us different",
      items: Array.isArray(audienceAnalysis?.keyFeatures)
        ? audienceAnalysis.keyFeatures.map((feature: string, index: number) => ({
            title: feature.split(':')[0] || feature,
            description: feature.split(':')[1] || feature,
            icon: "🎯",
            image: savedImages[index % savedImages.length] || defaultFeatures[index % defaultFeatures.length].image
          }))
        : defaultFeatures,
    },
    testimonials: {
      title: "What Our Clients Say",
      items: [{
        quote: "This solution has transformed how we operate. Highly recommended!",
        author: "John Smith",
        role: "Business Owner"
      },
      {
        quote: "The best decision we made for our business growth.",
        author: "Jane Doe",
        role: "Marketing Director"
      }],
    },
    objections: {
      subheadline: "Common Questions Answered",
      concerns: [
        {
          question: "Is this right for my business?",
          answer: "Our solution is designed to scale with businesses of all sizes"
        },
        {
          question: "What about implementation?",
          answer: "We provide full support throughout the implementation process"
        }
      ]
    },
    faq: {
      subheadline: "Frequently Asked Questions",
      questions: [
        {
          question: "How do I get started?",
          answer: "Getting started is easy - simply sign up and follow our guided onboarding process"
        },
        {
          question: "What support do you offer?",
          answer: "We offer 24/7 customer support through multiple channels"
        }
      ]
    },
    cta: {
      title: "Ready to Get Started?",
      description: "Join thousands of satisfied customers and transform your business today.",
      buttonText: "Start Now",
    },
    footerContent: {
      contact: "Contact us at: support@example.com",
      newsletter: "Subscribe to our newsletter for updates",
      copyright: `© ${new Date().getFullYear()} All rights reserved.`
    }
  };
};
