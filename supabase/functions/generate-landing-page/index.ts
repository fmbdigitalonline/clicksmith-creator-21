
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface BusinessIdea {
  description?: string;
  valueProposition?: string;
}

interface TargetAudience {
  description?: string;
  coreMessage?: string;
  messagingApproach?: string;
}

interface RequestBody {
  projectId: string;
  businessName: string;
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  template?: any;
  existingContent?: any;
  layoutStyle?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { businessName, businessIdea, targetAudience } = await req.json() as RequestBody;

    console.log('Received request:', { businessName, businessIdea, targetAudience });

    // Extract the descriptions from nested objects
    const businessDescription = businessIdea?.description || businessIdea?.valueProposition || '';
    const targetDescription = targetAudience?.coreMessage || targetAudience?.description || '';

    // Generate content based on the business idea and target audience
    const landingPageContent = {
      hero: {
        title: businessIdea?.valueProposition || businessName || "Welcome",
        description: businessDescription.slice(0, 150) + (businessDescription.length > 150 ? "..." : ""),
        cta: "Get Started Now",
        image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
      },
      valueProposition: {
        title: "Why Choose Us",
        description: targetAudience?.messagingApproach || "We deliver exceptional value to our customers",
        cards: [
          {
            title: "Expert Solutions",
            description: "Tailored to your unique needs",
            icon: "✨"
          },
          {
            title: "Proven Results",
            description: "Track record of success",
            icon: "📈"
          },
          {
            title: "Dedicated Support",
            description: "Here when you need us",
            icon: "🤝"
          }
        ]
      },
      marketAnalysis: {
        features: [
          {
            title: "Easy Integration",
            description: "Seamlessly fits into your workflow",
            icon: "🔄",
            image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f"
          },
          {
            title: "Data-Driven",
            description: "Make informed decisions with powerful analytics",
            icon: "📊",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71"
          }
        ]
      },
      testimonials: {
        items: [
          {
            quote: "This solution transformed our business operations",
            author: "Jane Smith",
            role: "CEO",
            company: "TechCorp"
          }
        ]
      },
      pricing: {
        title: "Simple, Transparent Pricing",
        description: "Choose the plan that fits your needs",
        items: [
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
      finalCta: {
        title: "Ready to Get Started?",
        description: targetDescription,
        cta: "Start Now"
      },
      footer: {
        links: {
          company: ["About", "Contact", "Careers"],
          resources: ["Blog", "Help Center", "Support"]
        },
        copyright: `© ${new Date().getFullYear()} ${businessName || 'Company'}. All rights reserved.`
      }
    };

    console.log('Generated landing page content:', landingPageContent);

    return new Response(
      JSON.stringify(landingPageContent),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in generate-landing-page:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }), 
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400
      }
    )
  }
})
