
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  businessIdea: {
    description: string;
    valueProposition: string;
  };
  targetAudience: {
    icp: string;
    name: string;
    painPoints: string[];
    coreMessage: string;
    description: string;
    positioning: string;
    demographics: string;
    marketingAngle: string;
    marketingChannels: string[];
    messagingApproach: string;
  };
  audienceAnalysis: {
    marketDesire: string;
    awarenessLevel: string;
    deepPainPoints: string[];
    expandedDefinition: string;
    potentialObjections: string[];
    sophisticationLevel: string;
  };
  projectImages?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log('Received request data:', JSON.stringify(requestData, null, 2));

    if (!requestData.businessIdea || !requestData.targetAudience || !requestData.audienceAnalysis) {
      throw new Error('Missing required fields in request body');
    }

    // Generate the landing page content based on the input data
    const landingPageContent = {
      hero: {
        title: requestData.businessIdea.valueProposition || requestData.businessIdea.description,
        description: requestData.targetAudience.coreMessage,
        cta: "Get Started Now",
        image: requestData.projectImages?.[0] || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
      },
      howItWorks: {
        subheadline: "How It Works",
        steps: [
          {
            title: "Discover",
            description: "Learn how our solution addresses your specific needs"
          },
          {
            title: "Implement",
            description: "Quick and easy setup with our expert guidance"
          },
          {
            title: "Transform",
            description: "See immediate results and continuous improvement"
          }
        ],
        valueReinforcement: requestData.targetAudience.positioning
      },
      marketAnalysis: {
        context: "Understanding Your Challenges",
        solution: requestData.businessIdea.valueProposition,
        painPoints: requestData.targetAudience.painPoints.map(point => ({
          title: point,
          description: point
        })),
        features: requestData.audienceAnalysis.deepPainPoints.map((point, index) => ({
          title: `Solution ${index + 1}`,
          description: point,
          image: requestData.projectImages?.[index] || `https://images.unsplash.com/photo-${index + 1}`,
          icon: "✨"
        })),
        socialProof: {
          quote: requestData.targetAudience.coreMessage,
          author: "Industry Leader",
          title: "Satisfied Customer"
        }
      },
      valueProposition: {
        title: "Why Choose Us",
        description: requestData.targetAudience.messagingApproach,
        cards: requestData.targetAudience.marketingChannels.map(channel => ({
          icon: "✨",
          title: channel,
          description: `Leverage ${channel} for maximum impact`
        }))
      },
      testimonials: {
        title: "What Our Clients Say",
        description: "Real results from real customers",
        items: [
          {
            quote: requestData.audienceAnalysis.marketDesire,
            author: requestData.targetAudience.name,
            role: "Satisfied Customer",
            company: "Leading Company"
          }
        ]
      },
      objections: {
        subheadline: "Common Questions Answered",
        description: "We understand your concerns",
        concerns: requestData.audienceAnalysis.potentialObjections.map(objection => ({
          question: objection,
          answer: `We address this by providing comprehensive solutions and support.`
        }))
      },
      cta: {
        title: "Ready to Get Started?",
        description: requestData.targetAudience.coreMessage,
        buttonText: "Start Now",
        subtext: "Risk-free trial • Cancel anytime"
      }
    };

    return new Response(
      JSON.stringify(landingPageContent),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({
        error: 'Invalid request body',
        details: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      },
    );
  }
});
