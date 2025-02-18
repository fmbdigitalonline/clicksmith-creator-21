
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

    // Extract key information
    const businessDescription = typeof businessIdea === 'string' 
      ? businessIdea 
      : businessIdea?.description || businessIdea?.valueProposition || '';
    
    const targetDescription = typeof targetAudience === 'string'
      ? targetAudience
      : targetAudience?.description || targetAudience?.coreMessage || '';

    const painPoints = targetAudience?.painPoints || [];
    const marketingChannels = targetAudience?.marketingChannels || [];
    const positioning = targetAudience?.positioning || '';
    const marketingAngle = targetAudience?.marketingAngle || '';

    // Generate content using the detailed information
    const landingPageContent = {
      hero: {
        title: businessIdea?.valueProposition || "Transform Your Business",
        description: businessDescription,
        cta: "Get Started Now",
        image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
      },
      valueProposition: {
        title: "Why Choose Us",
        description: targetAudience?.coreMessage || "We understand your needs",
        cards: painPoints.slice(0, 3).map(point => ({
          title: point.split(':')[0] || point,
          description: point.split(':')[1] || "We have the solution",
          icon: "✨"
        }))
      },
      features: {
        title: "Features That Matter",
        description: positioning,
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
            description: `Reach your audience on ${marketingChannels.slice(0, 3).join(', ')}`,
            icon: "🎯"
          }
        ]
      },
      testimonials: {
        title: "Success Stories",
        items: [
          {
            quote: marketingAngle,
            author: targetAudience?.name || "Satisfied Customer",
            role: "Business Owner",
            company: "Success Stories Ltd"
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
        title: marketingAngle || "Ready to Transform Your Business?",
        description: targetAudience?.messagingApproach || "Join thousands of successful businesses",
        buttonText: "Get Started Now"
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
