
export const generateInitialContent = (project: any) => {
  // Ensure we have the required objects, even if empty
  const businessIdea = project?.business_idea || {};
  const audienceAnalysis = project?.audience_analysis || {};
  const savedImages = project?.marketing_campaign?.saved_images || [];

  // Default card data with more options
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
    },
    {
      icon: "🚀",
      title: "Fast Results",
      description: "See immediate impact with our streamlined solutions"
    },
    {
      icon: "🤝",
      title: "Dedicated Support",
      description: "Personal assistance throughout your journey"
    },
    {
      icon: "💡",
      title: "Innovation",
      description: "Cutting-edge solutions for modern challenges"
    }
  ];

  // Enhanced features with more detailed descriptions
  const defaultFeatures = [
    {
      title: "Intuitive Platform",
      description: "Our user-friendly interface ensures you can get started immediately, with no steep learning curve. Everything you need is just a few clicks away.",
      image: savedImages[0] || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
      icon: "🎯"
    },
    {
      title: "Advanced Analytics",
      description: "Get detailed insights into your performance with our comprehensive analytics dashboard. Make data-driven decisions with confidence.",
      image: savedImages[1] || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
      icon: "📊"
    },
    {
      title: "Seamless Integration",
      description: "Easily connect with your existing tools and workflows. Our platform works harmoniously with your favorite business applications.",
      image: savedImages[2] || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
      icon: "🔄"
    },
    {
      title: "Security First",
      description: "Your data security is our top priority. Benefit from enterprise-grade security features and compliance standards.",
      image: savedImages[3] || "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
      icon: "🔒"
    }
  ];

  return {
    hero: {
      title: businessIdea?.valueProposition || project.title || "Welcome to Our Platform",
      description: businessIdea?.description || "Discover the best solution for your needs",
      cta: "Get Started Now",
      image: savedImages[0] || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
    },
    howItWorks: {
      subheadline: "How It Works",
      steps: [
        {
          title: "Step 1: Quick Setup",
          description: "Get started in minutes with our simple onboarding process. No technical expertise required."
        },
        {
          title: "Step 2: Customize",
          description: "Tailor the platform to your specific needs with our flexible customization options."
        },
        {
          title: "Step 3: Launch",
          description: "Go live with confidence, backed by our support team and comprehensive resources."
        },
        {
          title: "Step 4: Scale",
          description: "Grow your success with our scalable solutions and continuous optimization."
        }
      ],
      valueReinforcement: "Join thousands of successful businesses who trust our platform"
    },
    marketAnalysis: {
      context: "Understanding Your Needs",
      solution: "Our Comprehensive Solution",
      painPoints: [
        {
          title: "Time Consumption",
          description: "Traditional methods waste valuable time and resources"
        },
        {
          title: "Complex Integration",
          description: "Difficulty in connecting different tools and platforms"
        },
        {
          title: "Limited Insights",
          description: "Lack of actionable data for decision making"
        }
      ],
      features: Array.isArray(audienceAnalysis?.keyFeatures)
        ? audienceAnalysis.keyFeatures.map((feature: string, index: number) => ({
            title: feature.split(':')[0] || feature,
            description: feature.split(':')[1] || feature,
            image: savedImages[index % savedImages.length] || defaultFeatures[index % defaultFeatures.length].image,
            icon: "🎯"
          }))
        : defaultFeatures,
      socialProof: {
        quote: "This solution has transformed how we operate, delivering exceptional results across all metrics",
        author: "Alex Johnson",
        title: "Director of Operations, Tech Solutions Inc."
      }
    },
    valueProposition: {
      title: "Why Choose Us?",
      description: "We deliver comprehensive solutions that drive real results",
      cards: Array.isArray(audienceAnalysis?.benefits) 
        ? audienceAnalysis.benefits.map((benefit: string) => ({
            icon: "✨",
            title: benefit.split(':')[0] || benefit,
            description: benefit.split(':')[1] || benefit,
          }))
        : defaultCards,
    },
    features: {
      title: "Powerful Features",
      description: "Everything you need to succeed",
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
      description: "Success stories from businesses like yours",
      items: [
        {
          quote: "This platform has revolutionized our operations. The ROI we've seen is incredible!",
          author: "Sarah Chen",
          role: "Marketing Director",
          company: "Growth Dynamics"
        },
        {
          quote: "The best decision we made for our business growth. Support team is outstanding!",
          author: "Michael Rodriguez",
          role: "CEO",
          company: "Digital Solutions"
        },
        {
          quote: "Finally, a solution that delivers on its promises. Highly recommended!",
          author: "Emma Thompson",
          role: "Operations Manager",
          company: "Tech Innovators"
        }
      ],
    },
    objections: {
      subheadline: "Common Questions Answered",
      description: "We understand your concerns and we're here to help",
      concerns: [
        {
          question: "Is this right for my business?",
          answer: "Our solution is designed to scale with businesses of all sizes, from startups to enterprises. We offer flexible plans that adapt to your needs as you grow."
        },
        {
          question: "How long does implementation take?",
          answer: "Most clients are up and running within 24-48 hours. Our team provides full support throughout the implementation process to ensure a smooth transition."
        },
        {
          question: "What kind of support do you offer?",
          answer: "We provide 24/7 customer support through multiple channels, including live chat, email, and phone. Our dedicated success team ensures you get the most value from our platform."
        },
        {
          question: "Is my data secure?",
          answer: "We implement enterprise-grade security measures and are compliant with major data protection regulations. Your data security is our top priority."
        }
      ]
    },
    faq: {
      subheadline: "Frequently Asked Questions",
      description: "Everything you need to know about our platform",
      questions: [
        {
          question: "How do I get started?",
          answer: "Getting started is easy - simply sign up for a free trial and follow our guided onboarding process. No credit card required."
        },
        {
          question: "What integrations do you offer?",
          answer: "We integrate with all major business tools and platforms, including CRM systems, marketing tools, and analytics platforms."
        },
        {
          question: "Can I upgrade or downgrade my plan?",
          answer: "Yes, you can modify your plan at any time. Our flexible pricing ensures you only pay for what you need."
        },
        {
          question: "Is training provided?",
          answer: "Yes, we offer comprehensive training resources, including video tutorials, documentation, and live webinars."
        }
      ]
    },
    cta: {
      title: "Ready to Transform Your Business?",
      description: "Join thousands of satisfied customers and take your business to the next level.",
      buttonText: "Start Your Free Trial",
      subtext: "No credit card required • 14-day free trial • Cancel anytime"
    },
    footerContent: {
      contact: {
        email: "support@example.com",
        phone: "+1 (555) 123-4567",
        address: "123 Business Avenue, Suite 100, San Francisco, CA 94107"
      },
      social: {
        twitter: "https://twitter.com",
        linkedin: "https://linkedin.com",
        facebook: "https://facebook.com"
      },
      links: {
        company: ["About", "Careers", "Press", "News"],
        product: ["Features", "Pricing", "Security", "Enterprise"],
        resources: ["Blog", "Help Center", "API Docs", "Status"],
        legal: ["Privacy", "Terms", "Security", "Compliance"]
      },
      newsletter: {
        title: "Stay Updated",
        description: "Subscribe to our newsletter for the latest updates and insights"
      },
      copyright: `© ${new Date().getFullYear()} All rights reserved.`
    }
  };
};
