
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { projectId, businessName, businessIdea, targetAudience } = await req.json()
    
    console.log('Generating landing page for project:', projectId)
    console.log('Business data:', { businessName, businessIdea, targetAudience })

    // Transform data into consistent structure with proper nesting
    const landingPageContent = {
      hero: {
        content: {
          title: businessName || "Welcome",
          description: businessIdea?.description || "",
          cta: "Get Started",
          image: ""
        },
        layout: "centered"
      },
      value_proposition: {
        content: {
          title: "Why Choose Us",
          description: businessIdea?.valueProposition || "",
          cards: targetAudience?.painPoints?.map((point: string) => ({
            title: "Solution",
            description: point,
            icon: "✨"
          })) || []
        },
        layout: "grid"
      },
      features: {
        content: {
          title: "Key Features",
          description: "Discover what makes us unique",
          items: targetAudience?.marketingChannels?.map((channel: string) => ({
            title: channel,
            description: `Reach your audience on ${channel}`,
            icon: "🎯"
          })) || []
        },
        layout: "grid"
      },
      testimonials: {
        content: {
          title: "What Our Clients Say",
          items: []
        },
        layout: "grid"
      },
      pricing: {
        content: {
          title: "Simple Pricing",
          description: "Choose the plan that works for you",
          items: []
        },
        layout: "grid"
      },
      cta: {
        content: {
          title: "Ready to Get Started?",
          description: "Join us today and transform your business",
          buttonText: "Get Started Now"
        },
        layout: "centered"
      },
      footer: {
        content: {
          copyright: `© ${new Date().getFullYear()} All rights reserved.`,
          links: {
            company: ["About", "Contact"],
            resources: ["Documentation", "Support"]
          }
        },
        layout: "grid"
      }
    }

    return new Response(
      JSON.stringify(landingPageContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating landing page:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
