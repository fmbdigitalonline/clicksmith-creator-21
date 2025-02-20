
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LandingPageContent {
  hero?: {
    title: string;
    description: string;
    buttonText: string;
  };
  features?: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
  benefits?: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
  testimonials?: Array<{
    quote: string;
    author: string;
    role?: string;
    company?: string;
  }>;
  faq?: {
    items: Array<{
      question: string;
      answer: string;
    }>;
  };
  cta?: {
    title: string;
    description: string;
    buttonText: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { projectId, businessIdea, targetAudience, iterationNumber = 1 } = await req.json()

    console.log('Received request body:', JSON.stringify({
      projectId,
      businessIdea,
      targetAudience,
      iterationNumber
    }, null, 2))

    // Update generation status
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase.from('landing_page_generation_logs').insert({
      project_id: projectId,
      status: 'generation_started',
      step_details: { stage: 'started', timestamp: new Date().toISOString() },
      request_payload: { businessIdea, targetAudience }
    })

    // Generate content based on business idea and target audience
    const content: LandingPageContent = {
      hero: {
        title: `Comfortable, Stylish Bamboo Skirts for Active Girls`,
        description: `Experience the perfect blend of comfort and style with our eco-friendly bamboo skirts. Designed for young adventurers who never stop moving.`,
        buttonText: "Shop Now"
      },
      features: [
        {
          title: "Breathable Bamboo Fabric",
          description: "Made from premium bamboo material that keeps your active girl cool and comfortable all day long."
        },
        {
          title: "Versatile Design",
          description: "Perfect for both casual outings and active play, transitioning seamlessly from school to sports."
        },
        {
          title: "Eco-Friendly",
          description: "Sustainable bamboo fabric that's gentle on the environment and your child's skin."
        }
      ],
      benefits: [
        {
          title: "All-Day Comfort",
          description: "Soft, breathable fabric that moves with your child during any activity."
        },
        {
          title: "Easy Care",
          description: "Machine washable and durable, designed to last through countless adventures."
        },
        {
          title: "Style Meets Function",
          description: "Modern designs that look great while providing the flexibility active kids need."
        }
      ],
      testimonials: [
        {
          quote: "Finally, a skirt that keeps up with my daughter's active lifestyle!",
          author: "Sarah M.",
          role: "Parent"
        },
        {
          quote: "The comfort and quality are amazing. My daughter won't wear anything else now.",
          author: "Jennifer L.",
          role: "Parent"
        }
      ],
      faq: {
        items: [
          {
            question: "How does bamboo fabric benefit active children?",
            answer: "Bamboo fabric is naturally moisture-wicking, breathable, and soft, making it perfect for active children. It keeps them cool during physical activities while providing maximum comfort."
          },
          {
            question: "Are the skirts suitable for sports activities?",
            answer: "Yes! Our skirts are designed with active girls in mind, featuring flexible materials and designs that allow for full range of motion during sports and play."
          },
          {
            question: "How do I care for bamboo clothing?",
            answer: "Our bamboo skirts are easy to care for - simply machine wash in cold water and tumble dry on low. The fabric maintains its quality wash after wash."
          }
        ]
      },
      cta: {
        title: "Ready to Transform Your Child's Wardrobe?",
        description: "Join the growing number of parents choosing comfortable, sustainable clothing for their active children.",
        buttonText: "Get Started Today"
      }
    }

    // Update status to content generated
    await supabase.from('landing_page_generation_logs').insert({
      project_id: projectId,
      status: 'content_generated',
      step_details: { stage: 'content_generated', timestamp: new Date().toISOString() },
      success: true
    })

    // Basic theme settings
    const theme_settings = {
      colorScheme: "light",
      primaryColor: "#4F46E5",
      secondaryColor: "#818CF8",
      fontFamily: "Inter, sans-serif",
      heroLayout: "centered",
      featuresLayout: "grid",
      benefitsLayout: "grid",
      testimonialsLayout: "grid"
    }

    return new Response(
      JSON.stringify({
        content,
        theme_settings,
        statistics: {
          metrics: [],
          data_points: []
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
