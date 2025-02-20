
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      projectId, 
      businessName, 
      businessIdea, 
      targetAudience,
      currentContent,
      isRefinement,
      iterationNumber = 1
    } = await req.json();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create a log entry
    const { data: log } = await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        status: 'started',
        step_details: { stage: 'started' },
        success: false
      })
      .select()
      .single();

    if (!log) throw new Error('Failed to create generation log');

    // Determine the expansion mode based on iteration number
    const expansionMode = iterationNumber <= 2 ? 'core_content' :
                         iterationNumber <= 4 ? 'detailed_expansion' :
                         'final_polish';

    // Generate content with progressive detail
    const content = {
      hero: {
        title: `${businessName} - Innovation Meets Excellence`,
        description: isRefinement ? 
          `${currentContent.hero.content.description}\n\nFurther refined: ${businessIdea}` :
          `Transform your experience with our cutting-edge solutions. ${businessIdea}`,
        cta: "Get Started Today",
      },
      features: {
        title: "Why Choose Us",
        cards: expansionMode === 'core_content' ? [
          {
            title: "Expert Solutions",
            description: "Industry-leading expertise and proven results",
          },
          {
            title: "Customer Focus",
            description: "Dedicated to your success with personalized support",
          },
          {
            title: "Innovation",
            description: "Cutting-edge technology and forward-thinking approaches",
          }
        ] : expansionMode === 'detailed_expansion' ? [
          {
            title: "Expert Solutions",
            description: "Industry-leading expertise with proven results backed by years of experience. Our solutions are tailored to your specific needs.",
            bulletPoints: [
              "Customized approaches for your unique challenges",
              "Data-driven decision making",
              "Continuous improvement methodology"
            ]
          },
          {
            title: "Customer Focus",
            description: "We put your success at the heart of everything we do. Our dedicated support team ensures you get the most value from our partnership.",
            bulletPoints: [
              "24/7 dedicated support",
              "Personalized onboarding process",
              "Regular check-ins and updates"
            ]
          },
          {
            title: "Innovation",
            description: "Stay ahead of the curve with our cutting-edge technology and forward-thinking approaches that drive real results.",
            bulletPoints: [
              "Latest technology adoption",
              "Continuous feature updates",
              "Industry-leading practices"
            ]
          }
        ] : [
          // Final polish adds concrete examples and metrics
          {
            title: "Expert Solutions",
            description: `Industry-leading expertise with proven results backed by ${iterationNumber} years of experience. Our solutions have helped businesses achieve an average of 45% improvement in efficiency.`,
            bulletPoints: [
              "Customized approaches with 98% client satisfaction rate",
              "Data-driven decisions backed by advanced analytics",
              "ISO-certified improvement methodology"
            ],
            metrics: {
              improvement: "45%",
              satisfaction: "98%",
              implementation: "< 2 weeks"
            }
          },
          // ... similar expansions for other cards
        ]
      },
      benefits: {
        title: "Our Features",
        items: expansionMode === 'core_content' ? [
          {
            title: "Comprehensive Solutions",
            description: "End-to-end services tailored to your needs"
          },
          {
            title: "Expert Support",
            description: "24/7 assistance from our dedicated team"
          },
          {
            title: "Proven Results",
            description: "Track record of success with satisfied clients"
          }
        ] : expansionMode === 'detailed_expansion' ? [
          {
            title: "Comprehensive Solutions",
            description: "Our end-to-end services are meticulously tailored to address your specific challenges and goals.",
            details: [
              "Custom implementation plans",
              "Integrated workflows",
              "Scalable architecture"
            ]
          },
          // ... expanded benefits
        ] : [
          // Final polish with concrete examples
          {
            title: "Comprehensive Solutions",
            description: "Our end-to-end services have helped over 500 businesses achieve their goals with measurable results.",
            details: [
              "Custom implementation plans with 99.9% uptime",
              "Integrated workflows reducing manual work by 75%",
              "Scalable architecture supporting 10x growth"
            ],
            caseStudy: {
              metric: "75%",
              description: "Average reduction in manual workflows"
            }
          },
          // ... similar expansions for other items
        ]
      },
      testimonials: {
        title: "What Our Clients Say",
        items: expansionMode === 'final_polish' ? [
          {
            quote: "A game-changing solution that transformed our business operations and improved efficiency by 40%.",
            author: "Jane Smith",
            role: "CEO, Tech Solutions Inc.",
            metrics: {
              improvement: "40%",
              timeframe: "6 months"
            }
          },
          {
            quote: "The level of support and expertise we received was exceptional. Our ROI exceeded expectations.",
            author: "John Doe",
            role: "CTO, Innovation Corp",
            metrics: {
              roi: "250%",
              satisfaction: "5/5"
            }
          }
        ] : [
          {
            quote: "A game-changing solution that transformed our business.",
            author: "Jane Smith",
            role: "CEO, Tech Solutions Inc."
          }
        ]
      },
      pricing: {
        title: "Simple, Transparent Pricing",
        description: "Choose the plan that's right for you",
        items: [
          {
            title: "Starter",
            price: "$49/mo",
            features: expansionMode === 'core_content' ? 
              ["Basic features", "Email support", "1 user"] :
              ["All basic features", "Priority email support", "Up to 5 users", "99.9% uptime SLA", "Basic analytics"]
          },
          {
            title: "Professional",
            price: "$99/mo",
            features: expansionMode === 'core_content' ?
              ["Advanced features", "Priority support", "5 users"] :
              ["All Starter features", "24/7 phone support", "Up to 20 users", "Advanced analytics", "Custom integrations"]
          }
        ]
      }
    };

    // Update log for content generation
    await supabase
      .from('landing_page_generation_logs')
      .update({
        step_details: { stage: 'content_generated' },
        status: 'generating_images'
      })
      .eq('id', log.id);

    // Generate hero image
    const imagePrompt = `Create a professional, modern hero image for ${businessName}. ${businessIdea}. Style: clean, corporate, professional.`;
    
    const imageResponse = await fetch(`${supabaseUrl}/functions/v1/generate-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        style: "1-1",
        width: 1024,
        height: 1024,
      }),
    });

    if (!imageResponse.ok) {
      throw new Error('Failed to generate image');
    }

    const imageData = await imageResponse.json();
    content.hero.image = imageData.images[0];

    // Calculate statistics based on the content
    const statistics = {
      metrics: [
        {
          label: "Content Sections",
          value: Object.keys(content).length
        },
        {
          label: "Iteration",
          value: iterationNumber
        },
        {
          label: "Detail Level",
          value: expansionMode.replace('_', ' ')
        }
      ],
      data_points: [
        {
          category: "Content",
          metrics: {
            sections: Object.keys(content).length,
            features: content.features.cards.length,
            testimonials: content.testimonials.items.length
          }
        }
      ]
    };

    // Update log for completion
    await supabase
      .from('landing_page_generation_logs')
      .update({
        status: 'completed',
        step_details: { stage: 'images_generated' },
        success: true,
        response_payload: { content, statistics }
      })
      .eq('id', log.id);

    // Return the generated content
    return new Response(JSON.stringify({ 
      content,
      theme_settings: {
        heroLayout: "centered",
        featuresLayout: "grid",
        benefitsLayout: "grid",
        testimonialsLayout: "grid",
        pricingLayout: "grid"
      },
      statistics
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
