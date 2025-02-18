
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import Replicate from "https://esm.sh/replicate@0.25.2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface BusinessIdea {
  description?: string;
  valueProposition?: string;
}

interface TargetAudience {
  description?: string;
  coreMessage?: string;
  messagingApproach?: string;
  painPoints?: string[];
  benefits?: string[];
}

interface RequestBody {
  projectId: string;
  businessName: string;
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  template?: any;
  existingContent?: any;
  layoutStyle?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectId, businessName, businessIdea, targetAudience } = await req.json() as RequestBody;

    console.log('Received request:', { businessName, businessIdea, targetAudience });

    // Extract the descriptions from nested objects
    const businessDescription = businessIdea?.description || businessIdea?.valueProposition || '';
    const targetDescription = targetAudience?.coreMessage || targetAudience?.description || '';

    // Initialize Replicate client for image generation
    const replicate = new Replicate({
      auth: Deno.env.get('REPLICATE_API_TOKEN') || '',
    });

    // Generate a hero image prompt based on business description
    const imagePrompt = `Create a modern, professional hero image for a business website. The business is about: ${businessDescription}. Style: clean, minimalist, corporate, high-quality, professional photography.`;
    
    console.log('Generating hero image with prompt:', imagePrompt);
    
    // Generate hero image using Replicate
    const heroImage = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: imagePrompt,
          go_fast: true,
          megapixels: "1",
          num_outputs: 1,
          aspect_ratio: "16:9",
          output_format: "webp",
          output_quality: 80,
          num_inference_steps: 4
        }
      }
    );

    console.log('Generated hero image:', heroImage);

    // Generate benefits and features from pain points if they exist
    const benefits = targetAudience?.benefits || targetAudience?.painPoints?.map(pain => ({
      title: `Solution for ${pain}`,
      description: `We help you overcome ${pain.toLowerCase()} with our innovative approach.`,
      icon: "✨"
    })) || [
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
    ];

    // Generate features based on benefits
    const features = benefits.map((benefit, index) => ({
      title: benefit.title,
      description: benefit.description,
      icon: "🎯",
      image: heroImage[index % heroImage.length] || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
    }));

    // Generate content based on the business idea and target audience
    const landingPageContent = {
      hero: {
        title: businessIdea?.valueProposition || businessName || "Welcome",
        description: businessDescription.slice(0, 150) + (businessDescription.length > 150 ? "..." : ""),
        cta: "Get Started Now",
        image: Array.isArray(heroImage) && heroImage.length > 0 ? heroImage[0] : "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
      },
      valueProposition: {
        title: "Why Choose Us?",
        description: targetAudience?.messagingApproach || "We deliver exceptional value to our customers",
        cards: benefits.slice(0, 3) // Limit to 3 cards for better layout
      },
      marketAnalysis: {
        features: features.slice(0, 2) // Limit to 2 main features
      },
      testimonials: {
        title: "What Our Clients Say",
        description: "Real feedback from satisfied customers",
        items: [
          {
            quote: `${businessDescription.slice(0, 50)}... has transformed how we work`,
            author: "Sarah Chen",
            role: "Director",
            company: "Innovation Corp"
          }
        ]
      },
      pricing: {
        title: "Simple, Transparent Pricing",
        description: "Choose the plan that fits your needs",
        items: [
          {
            name: "Starter",
            price: "Free",
            features: ["Basic features", "Community support", "1 project"]
          },
          {
            name: "Pro",
            price: "$49/mo",
            features: ["All features", "Priority support", "Unlimited projects"]
          }
        ]
      },
      finalCta: {
        title: "Ready to Transform Your Business?",
        description: targetDescription,
        cta: "Get Started Now"
      },
      footer: {
        links: {
          company: ["About", "Contact", "Careers"],
          resources: ["Blog", "Help Center", "Support"]
        },
        copyright: `© ${new Date().getFullYear()} ${businessName || 'Company'}. All rights reserved.`
      }
    };

    console.log('Generated landing page content:', landingPageContent);

    // Save the generated content to the database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const { error: updateError } = await supabase
      .from('landing_pages')
      .upsert({
        project_id: projectId,
        content: landingPageContent,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('Error updating landing page:', updateError);
      throw updateError;
    }

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
