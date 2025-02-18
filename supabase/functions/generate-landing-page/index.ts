
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log("Received request data:", JSON.stringify(requestData, null, 2));

    const {
      projectId,
      businessName,
      businessIdea,
      targetAudience,
      audienceAnalysis,
      marketingCampaign,
      selectedHooks,
      generatedAds,
      timestamp // Include timestamp in destructuring
    } = requestData;

    // Log the timestamp to verify we're getting new requests
    console.log("Generation timestamp:", timestamp);

    // Extract useful elements from the data
    const painPoints = targetAudience?.painPoints || [];
    const hooks = selectedHooks || [];
    const valueProposition = businessIdea?.valueProposition || '';

    // Add some randomization to content selection
    const getRandomItem = <T>(array: T[]): T => {
      return array[Math.floor(Math.random() * array.length)];
    };

    // Build landing page content with some variation
    const landingPageContent = {
      hero: {
        title: businessIdea?.valueProposition || businessName || "Welcome",
        subtitle: targetAudience?.coreMessage || "Transform Your Business Today",
        description: valueProposition,
        cta: getRandomItem([
          "Get Started Now",
          "Start Your Journey",
          "Begin Today",
          "Transform Your Business"
        ]),
        image: generatedAds?.[0]?.imageUrl || null
      },

      value_proposition: {
        title: "Why Choose Us",
        subtitle: targetAudience?.positioning || "We deliver results",
        items: painPoints.map((point, index) => ({
          title: `Solution ${index + 1}`,
          description: point,
          icon: getRandomItem(["CheckCircle", "Star", "Shield", "Zap"])
        }))
      },

      features: {
        title: "Key Features",
        subtitle: "Everything you need to succeed",
        items: hooks.map((hook, index) => ({
          title: hook.text || `Feature ${index + 1}`,
          description: hook.description || "Description coming soon",
          icon: getRandomItem(["Star", "Zap", "Shield", "Award"])
        }))
      },

      proof: {
        title: getRandomItem([
          "Success Stories",
          "Client Testimonials",
          "What Our Clients Say",
          "Real Results"
        ]),
        subtitle: `Join other ${targetAudience?.name || 'satisfied customers'}`,
        testimonials: [
          {
            quote: targetAudience?.painPoints?.[0] || "Great experience!",
            author: targetAudience?.name || "Happy Customer",
            role: "Verified User"
          }
        ]
      },

      pricing: {
        title: getRandomItem([
          "Simple Pricing",
          "Choose Your Plan",
          "Pricing Plans",
          "Start Today"
        ]),
        subtitle: "Choose the perfect plan for your needs",
        plans: [
          {
            name: "Starter",
            price: "Free",
            features: ["Basic access", "Community support", "Core features"]
          },
          {
            name: "Pro",
            price: "$49/mo",
            features: ["Full access", "Priority support", "Advanced features"]
          }
        ]
      },

      finalCta: {
        title: getRandomItem([
          "Ready to Get Started?",
          "Start Your Journey Today",
          "Transform Your Business Now",
          "Join Us Today"
        ]),
        description: targetAudience?.messagingApproach || "Take the first step towards success",
        buttonText: getRandomItem([
          "Get Started",
          "Start Now",
          "Begin Your Journey",
          "Transform Today"
        ])
      },

      footer: {
        companyName: businessName,
        description: valueProposition,
        links: {
          product: ["Features", "Pricing", "Documentation"],
          company: ["About", "Blog", "Careers"],
          resources: ["Support", "Contact", "Privacy"]
        }
      }
    };

    console.log("Generated landing page content:", JSON.stringify(landingPageContent, null, 2));

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
    console.error('Error generating landing page:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Error occurred while generating landing page content"
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
