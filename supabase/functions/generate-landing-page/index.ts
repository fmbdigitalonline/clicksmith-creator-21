
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestText = await req.text();
    console.log('Raw request body:', requestText);
    
    const requestData = JSON.parse(requestText);
    console.log('Parsed request data:', requestData);

    const { projectId, businessName, businessIdea, targetAudience } = requestData;

    // Ensure we have the required data
    if (!projectId || !businessName) {
      throw new Error('Missing required fields: projectId and businessName');
    }

    // Generate the landing page content
    const landingPageContent = {
      hero: {
        title: businessIdea?.valueProposition || businessIdea?.description || "Transform Your Business",
        description: businessIdea?.description || "",
        cta: "Get Started Now",
        image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
      },
      valueProposition: {
        title: "Why Choose Us",
        description: targetAudience?.coreMessage || targetAudience?.description || "We understand your needs",
        cards: (targetAudience?.painPoints || []).slice(0, 3).map(point => ({
          title: point,
          description: "We have the solution",
          icon: "✨"
        }))
      },
      features: {
        title: "Features That Matter",
        description: businessIdea?.description || "",
        items: [
          {
            title: "Streamlined Process",
            description: "From idea to execution in minutes",
            icon: "🚀"
          },
          {
            title: "Smart Automation",
            description: "Save time with AI-powered tools",
            icon: "⚡"
          },
          {
            title: "Multi-Channel Support",
            description: `Reach your audience effectively`,
            icon: "🎯"
          }
        ]
      },
      testimonials: {
        title: "Success Stories",
        items: [
          {
            quote: targetAudience?.marketingAngle || "Love this platform!",
            author: targetAudience?.name || "Satisfied Customer",
            role: "Business Owner",
            company: businessName
          }
        ]
      },
      pricing: {
        title: "Simple Pricing",
        description: "Choose the plan that works for you",
        items: [
          {
            title: "Starter",
            price: "Free",
            description: "Perfect for getting started",
            features: [
              "Basic features",
              "Community support",
              "1 project"
            ],
            cta: "Start Now"
          },
          {
            title: "Pro",
            price: "$49/mo",
            description: "For growing businesses",
            features: [
              "All features",
              "Priority support",
              "Unlimited projects"
            ],
            cta: "Go Pro"
          }
        ]
      },
      cta: {
        title: "Ready to Transform Your Business?",
        description: targetAudience?.messagingApproach || "Join us today",
        buttonText: "Get Started Now"
      },
      footer: {
        copyright: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`,
        links: {
          company: ["About", "Contact", "Careers"],
          resources: ["Documentation", "Support", "Terms"]
        }
      }
    };

    return new Response(
      JSON.stringify(landingPageContent),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

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
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
});
