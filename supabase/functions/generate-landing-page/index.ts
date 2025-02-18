
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
    console.log("Received request data in edge function:", JSON.stringify(requestData, null, 2));

    const {
      projectId,
      businessName,
      businessIdea,
      targetAudience,
      audienceAnalysis,
      marketingCampaign,
      selectedHooks,
      generatedAds,
      timestamp
    } = requestData;

    // Log each piece of data separately for debugging
    console.log("Project ID:", projectId);
    console.log("Business Name:", businessName);
    console.log("Business Idea:", JSON.stringify(businessIdea, null, 2));
    console.log("Target Audience:", JSON.stringify(targetAudience, null, 2));
    console.log("Audience Analysis:", JSON.stringify(audienceAnalysis, null, 2));
    console.log("Marketing Campaign:", JSON.stringify(marketingCampaign, null, 2));
    console.log("Selected Hooks:", JSON.stringify(selectedHooks, null, 2));
    console.log("Generated Ads:", JSON.stringify(generatedAds, null, 2));
    console.log("Timestamp:", timestamp);

    // Extract useful elements from the data
    const painPoints = targetAudience?.painPoints || [];
    const hooks = selectedHooks || [];
    const valueProposition = businessIdea?.valueProposition || '';
    const marketDesire = audienceAnalysis?.marketDesire || '';
    const objections = audienceAnalysis?.potentialObjections || [];

    // Add randomization elements
    const getRandomItem = <T>(array: T[]): T => {
      return array[Math.floor(Math.random() * array.length)];
    };

    // Add some variation in content generation
    const headlines = [
      valueProposition,
      marketDesire,
      targetAudience?.coreMessage,
      `Transform your ${businessName || 'business'} today`
    ].filter(Boolean);

    const ctaButtons = [
      "Get Started Now",
      "Begin Your Journey",
      "Transform Today",
      "Learn More",
      targetAudience?.marketingAngle
    ].filter(Boolean);

    // Build landing page content with variation
    const landingPageContent = {
      hero: {
        title: getRandomItem(headlines) || "Welcome",
        subtitle: targetAudience?.coreMessage || "Transform Your Business Today",
        description: valueProposition,
        cta: getRandomItem(ctaButtons),
        image: generatedAds?.[0]?.imageUrl || null
      },

      value_proposition: {
        title: "Why Choose Us",
        subtitle: targetAudience?.positioning || marketDesire || "We deliver results",
        items: painPoints.map((point, index) => ({
          title: `Solution ${index + 1}`,
          description: point,
          icon: getRandomItem(["CheckCircle", "Star", "Shield", "Zap"])
        })).slice(0, 3) // Limit to 3 items for better presentation
      },

      features: {
        title: "Key Features",
        subtitle: "Everything you need to succeed",
        items: (hooks.length > 0 ? hooks : objections).map((item: any, index: number) => ({
          title: item.text || item || `Feature ${index + 1}`,
          description: item.description || "Details coming soon",
          icon: getRandomItem(["Star", "Zap", "Shield", "Award"])
        })).slice(0, 6) // Limit to 6 features
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
            quote: marketDesire || painPoints[0] || "Great experience!",
            author: targetAudience?.name || "Happy Customer",
            role: "Verified User"
          }
        ]
      },

      pricing: {
        title: "Simple Pricing",
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
          "Start Your Journey Today",
          targetAudience?.messagingApproach,
          "Transform Your Business Now",
          "Join Us Today"
        ]) || "Ready to Get Started?",
        description: targetAudience?.messagingApproach || "Take the first step towards success",
        buttonText: getRandomItem(ctaButtons)
      },

      footer: {
        companyName: businessName || "Your Business",
        description: valueProposition || marketDesire || "Transform your business today",
        links: {
          product: ["Features", "Pricing", "Documentation"],
          company: ["About", "Blog", "Careers"],
          resources: ["Support", "Contact", "Privacy"]
        }
      }
    };

    console.log("Generated content:", JSON.stringify(landingPageContent, null, 2));

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
    console.error('Error in edge function:', error);
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
