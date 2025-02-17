
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.20.1";
import Replicate from "https://esm.sh/replicate@0.25.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Request received, method:", req.method);
    
    let body;
    try {
      const text = await req.text();
      console.log("Raw request body:", text);
      body = JSON.parse(text);
      console.log("Parsed request body:", body);
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          details: error.message 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { businessIdea, targetAudience, audienceAnalysis } = body;

    if (!businessIdea) {
      console.error("Missing business idea in request");
      return new Response(
        JSON.stringify({ error: 'Business idea is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("Starting landing page generation with:", {
      businessIdea,
      targetAudience,
      audienceAnalysis
    });

    const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!apiKey) {
      console.error("DEEPSEEK_API_KEY is not set");
      throw new Error("API key configuration is missing");
    }

    // Generate mock content for testing
    const mockContent = {
      hero: {
        title: "Transform Your Business with Our Solution",
        description: "Discover how our innovative platform can help you achieve your business goals",
        cta: "Get Started Today",
        image: null
      },
      howItWorks: {
        subheadline: "Simple Steps to Success",
        steps: [
          {
            title: "Sign Up",
            description: "Create your account in minutes"
          },
          {
            title: "Customize",
            description: "Set up your preferences and requirements"
          },
          {
            title: "Launch",
            description: "Go live with your optimized solution"
          }
        ],
        valueReinforcement: "Start seeing results immediately"
      },
      marketAnalysis: {
        context: "The market demands innovative solutions",
        solution: "We provide cutting-edge technology",
        painPoints: [
          {
            title: "Efficiency",
            description: "Streamline your operations"
          }
        ],
        features: [
          {
            title: "Automation",
            description: "Save time and resources"
          }
        ],
        socialProof: {
          quote: "This solution transformed our business",
          author: "John Doe",
          title: "CEO"
        }
      },
      valueProposition: {
        title: "Why Choose Us",
        cards: [
          {
            title: "Quality",
            description: "Best-in-class solution",
            icon: "star"
          }
        ]
      },
      features: {
        title: "Features",
        description: "Everything you need to succeed",
        items: [
          {
            title: "Analytics",
            description: "Deep insights into your business",
            icon: "chart"
          }
        ]
      },
      testimonials: {
        title: "What Our Clients Say",
        items: [
          {
            quote: "Outstanding service and results",
            author: "Jane Smith",
            role: "Marketing Director"
          }
        ]
      },
      objections: {
        subheadline: "Common Questions",
        concerns: [
          {
            question: "Is it expensive?",
            answer: "We offer flexible pricing plans"
          }
        ]
      },
      faq: {
        subheadline: "Frequently Asked Questions",
        questions: [
          {
            question: "How long does it take to get started?",
            answer: "You can be up and running in minutes"
          }
        ]
      },
      cta: {
        title: "Ready to Get Started?",
        description: "Join thousands of satisfied customers",
        buttonText: "Start Now"
      },
      footerContent: {
        contact: "Contact us anytime",
        newsletter: "Subscribe for updates",
        copyright: "© 2024 All rights reserved"
      },
      theme: {
        colorScheme: {
          primary: "blue",
          secondary: "gray",
          accent: "indigo",
          background: "white"
        },
        typography: {
          headingFont: "Inter",
          bodyFont: "Roboto",
          style: "Modern and professional"
        },
        mood: "Professional and trustworthy",
        visualStyle: "Clean and minimal"
      }
    };

    // Return the mock content
    return new Response(
      JSON.stringify(mockContent),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in generate-landing-page function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
        type: error.constructor.name
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
