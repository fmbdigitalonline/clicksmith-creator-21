
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
    const {
      businessName,
      businessIdea,
      targetAudience,
      audienceAnalysis,
      marketingCampaign,
      selectedHooks,
      generatedAds,
    } = await req.json();

    console.log("Business data:", JSON.stringify({
      businessName,
      businessIdea,
      targetAudience,
      audienceAnalysis,
      marketingCampaign,
      selectedHooks,
      generatedAds
    }, null, 2));

    // Extract key elements from the marketing campaign
    const campaignAngles = marketingCampaign?.angles || [];
    const adCopies = marketingCampaign?.adCopies || [];
    const headlines = marketingCampaign?.headlines || [];

    // Build the landing page content using all available data
    const landingPageContent = {
      hero: {
        title: headlines[0] || businessName,
        subtitle: targetAudience?.coreMessage || businessIdea?.valueProposition,
        cta: "Get Started Now",
        description: businessIdea?.description
      },

      value_proposition: {
        title: "Why Choose Us",
        items: [
          {
            title: "Perfect for " + targetAudience?.name,
            description: targetAudience?.description
          },
          {
            title: "Understand Your Needs",
            description: audienceAnalysis?.marketDesire || targetAudience?.painPoints?.[0]
          },
          {
            title: "Proven Approach",
            description: targetAudience?.messagingApproach
          }
        ]
      },

      features: {
        title: "Key Features & Benefits",
        subtitle: "Everything you need to succeed",
        items: audienceAnalysis?.deepPainPoints?.map(pain => ({
          title: `Solution for ${pain}`,
          description: selectedHooks?.find(hook => 
            hook.text.toLowerCase().includes(pain.toLowerCase())
          )?.description || pain
        })) || []
      },

      proof: {
        title: "What Our Clients Say",
        subtitle: "Real Results, Real Stories",
        testimonials: generatedAds?.filter(ad => 
          ad.type === 'testimonial' || ad.content?.includes('testimonial')
        )?.map(ad => ({
          quote: ad.content,
          author: "Satisfied Client",
          role: targetAudience?.name
        })) || []
      },

      pricing: {
        title: "Simple, Transparent Pricing",
        subtitle: "Choose the plan that's right for you",
        plans: [
          {
            name: "Starter",
            price: "Free",
            features: [
              "Basic Features",
              "Community Support",
              "Limited Access"
            ]
          },
          {
            name: "Professional",
            price: "$49/mo",
            features: [
              "All Basic Features",
              "Priority Support",
              "Advanced Tools"
            ]
          }
        ]
      },

      finalCta: {
        title: campaignAngles?.[0]?.hook || "Ready to Get Started?",
        description: targetAudience?.positioning || "Join thousands of satisfied customers",
        buttonText: "Start Your Journey"
      },

      footer: {
        companyName: businessName,
        description: businessIdea?.valueProposition,
        links: {
          product: ["Features", "Pricing", "Benefits"],
          company: ["About Us", "Contact", "Privacy Policy"],
          resources: ["Blog", "Support", "Documentation"]
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
    console.error('Error generating landing page:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
