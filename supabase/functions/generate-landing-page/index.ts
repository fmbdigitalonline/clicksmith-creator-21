
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    let requestData;
    try {
      const requestText = await req.text();
      console.log('Raw request body:', requestText);
      
      if (!requestText) {
        throw new Error('Request body is empty');
      }
      
      requestData = JSON.parse(requestText);
      console.log('Parsed request data:', requestData);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({
          error: 'Invalid request body',
          details: parseError.message
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const { projectId, businessName, businessIdea, targetAudience } = requestData;

    // Validate required fields
    if (!projectId || !businessName) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: 'projectId and businessName are required'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Generate placeholder content for testing
    const landingPageContent = {
      hero: {
        title: businessName,
        description: businessIdea?.description || "Welcome to our platform",
        cta: "Get Started",
        image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
      },
      valueProposition: {
        title: "Why Choose Us",
        description: businessIdea?.valueProposition || "We deliver value to our customers",
        cards: [
          {
            title: "Quality Service",
            description: "Best-in-class service delivery",
            icon: "✨"
          },
          {
            title: "Expert Support",
            description: "24/7 dedicated support",
            icon: "🌟"
          },
          {
            title: "Innovation",
            description: "Cutting-edge solutions",
            icon: "💡"
          }
        ]
      },
      features: {
        title: "Our Features",
        description: "Discover what makes us unique",
        items: [
          {
            title: "Easy to Use",
            description: "Intuitive interface for all users",
            icon: "🎯"
          },
          {
            title: "Powerful Tools",
            description: "Advanced features at your fingertips",
            icon: "⚡"
          }
        ]
      },
      testimonials: {
        title: "What Our Clients Say",
        items: [
          {
            quote: "Amazing service and support!",
            author: "John Doe",
            role: "CEO",
            company: "Tech Corp"
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
      footer: {
        content: {
          copyright: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`,
          links: {
            company: ["About", "Contact", "Careers"],
            resources: ["Documentation", "Support", "Terms"]
          }
        }
      }
    };

    // Return the generated content
    return new Response(
      JSON.stringify(landingPageContent),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
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
