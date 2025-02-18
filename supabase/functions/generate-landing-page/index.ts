
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
    } = requestData;

    // Extract useful elements from the data
    const painPoints = targetAudience?.painPoints || [];
    const hooks = selectedHooks || [];
    const valueProposition = businessIdea?.valueProposition || '';
    const marketDesire = audienceAnalysis?.marketDesire || '';
    const objections = audienceAnalysis?.potentialObjections || [];

    console.log("Processing data for landing page generation:", {
      projectId,
      businessName,
      hooks: hooks.length,
      painPoints: painPoints.length
    });

    // Build comprehensive landing page content
    const landingPageContent = {
      hero: {
        title: businessName || "Welcome",
        subtitle: targetAudience?.coreMessage || "Transform Your Business Today",
        description: valueProposition,
        cta: "Get Started Now",
        image: generatedAds?.[0]?.imageUrl || null
      },

      value_proposition: {
        title: "Why Choose Us",
        subtitle: marketDesire,
        items: painPoints.map((point, index) => ({
          title: `Solution ${index + 1}`,
          description: point,
          icon: "CheckCircle"
        }))
      },

      features: {
        title: "Key Features",
        subtitle: "Everything you need to succeed",
        items: hooks.map((hook, index) => ({
          title: hook.text || `Feature ${index + 1}`,
          description: hook.description || "Description coming soon",
          icon: "Star"
        }))
      },

      proof: {
        title: "Success Stories",
        subtitle: `Join other ${targetAudience?.name || 'satisfied customers'}`,
        testimonials: [
          {
            quote: marketDesire,
            author: targetAudience?.name || "Happy Customer",
            role: "Verified User"
          }
        ]
      },

      pricing: {
        title: "Pricing Plans",
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
        title: "Ready to Get Started?",
        description: targetAudience?.messagingApproach || "Take the first step towards success",
        buttonText: "Start Now"
      },

      footer: {
        companyName: businessName,
        description: valueProposition,
        links: {
          product: ["Features", "Pricing", "Documentation"],
          company: ["About", "Blog", "Careers"],
          resources: ["Support", "Contact", "Privacy"]
        },
        socialLinks: {
          twitter: "#",
          facebook: "#",
          instagram: "#"
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
