
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessName, businessIdea, targetAudience, template, existingContent, layoutStyle } = await req.json();

    // Generate the landing page content
    const content = {
      hero: {
        title: `Welcome to ${businessName}`,
        description: businessIdea,
        cta: "Get Started",
        image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
      },
      valueProposition: {
        title: "Why Choose Us?",
        description: "We deliver comprehensive solutions that drive real results",
        cards: [
          {
            icon: "✨",
            title: "Quality Service",
            description: "Experience excellence in everything we do",
          },
          {
            icon: "🎯",
            title: "Expert Solutions",
            description: `Tailored specifically for ${targetAudience}`,
          },
          {
            icon: "💫",
            title: "Great Value",
            description: "Competitive pricing with premium features",
          },
        ],
      },
      marketAnalysis: {
        features: [
          {
            title: "Comprehensive Solution",
            description: "Everything you need in one place",
            icon: "🎯",
            image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
          },
          {
            title: "Easy Integration",
            description: "Seamless implementation process",
            icon: "⚡",
            image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
          },
        ],
      },
      testimonials: [
        {
          quote: "This solution has transformed our business operations!",
          author: "John Doe",
          role: "CEO",
          company: "Tech Innovations",
        },
      ],
      pricing: {
        title: "Simple, Transparent Pricing",
        description: "Choose the plan that's right for you",
        pricingTiers: [
          {
            name: "Starter",
            price: "Free",
            features: ["Basic features", "Community support", "1 project"],
            cta: "Get Started",
          },
          {
            name: "Pro",
            price: "$49/mo",
            features: ["All features", "Priority support", "Unlimited projects"],
            cta: "Go Pro",
          },
        ],
      },
      finalCta: {
        title: "Ready to Get Started?",
        description: "Join thousands of satisfied customers today.",
        buttonText: "Start Now",
        background: "bg-gradient-glass",
      },
      footer: {
        links: {
          company: ["About", "Contact", "Careers"],
          resources: ["Blog", "Help Center", "Support"],
        },
        copyright: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`,
      },
    };

    return new Response(
      JSON.stringify(content),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );

  } catch (error) {
    console.error("Error generating landing page:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});
