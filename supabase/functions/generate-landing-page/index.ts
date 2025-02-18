
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  businessIdea: {
    valueProposition?: string;
    description?: string;
  };
  targetAudience: {
    coreMessage?: string;
    messagingApproach?: string;
  };
  audienceAnalysis: any;
  projectImages: string[];
}

const getDefaultHero = (businessIdea: any) => ({
  title: businessIdea?.valueProposition || businessIdea?.description || "Transform Your Business",
  description: "Start your journey to success today",
  cta: "Get Started Now",
  image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
});

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { businessIdea, targetAudience, audienceAnalysis, projectImages } = await req.json() as RequestBody;

    console.log('Received request data:', { businessIdea, targetAudience, audienceAnalysis, projectImages });

    // Generate the landing page content
    const landingPageContent = {
      hero: {
        title: businessIdea?.valueProposition || businessIdea?.description || "Transform Your Business",
        description: targetAudience?.coreMessage || "Transform your business today",
        cta: "Get Started",
        image: projectImages[0] || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
      },
      valueProposition: {
        cards: [
          {
            title: "Expert Solutions",
            description: "Tailored to your unique needs",
            icon: "✨"
          },
          {
            title: "Proven Results",
            description: "Track record of success",
            icon: "📈"
          },
          {
            title: "Dedicated Support",
            description: "Here when you need us",
            icon: "🤝"
          }
        ]
      },
      marketAnalysis: {
        features: [
          {
            title: "Easy Integration",
            description: "Seamlessly fits into your workflow"
          },
          {
            title: "Time-Saving",
            description: "Automate repetitive tasks"
          },
          {
            title: "Cost-Effective",
            description: "Maximum value for your investment"
          }
        ]
      },
      testimonials: {
        items: [
          {
            quote: "This solution transformed our business operations",
            author: "Jane Smith",
            role: "CEO, TechCorp"
          }
        ]
      }
    };

    console.log('Generated content:', landingPageContent);

    return new Response(
      JSON.stringify(landingPageContent),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    )
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
          'Content-Type': 'application/json',
        },
        status: 400
      }
    )
  }
})
