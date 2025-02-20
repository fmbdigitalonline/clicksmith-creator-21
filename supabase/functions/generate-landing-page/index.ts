import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';
import { Configuration, OpenAIApi } from 'npm:openai@3.2.1';
import { corsHeaders } from '../_shared/cors.ts';

const openAiConfig = new Configuration({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const openai = new OpenAIApi(openAiConfig);

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { projectId, businessName, businessIdea, targetAudience, currentContent, isRefinement, iterationNumber = 1 } = await req.json();

    if (!projectId || !businessIdea) {
      throw new Error('Missing required parameters');
    }

    // Determine content expansion mode based on iteration
    const expansionMode = iterationNumber <= 2 ? 'core_content' :
                         iterationNumber <= 4 ? 'detailed_expansion' :
                         'final_polish';

    const content = {
      hero: {
        title: `Transform Your ${businessName} with Innovative Solutions`,
        description: `We help businesses like yours achieve remarkable results through ${businessIdea}.`,
        ctaText: "Get Started Today",
        image: "hero-image.jpg"
      },
      features: {
        title: "Why Choose Us",
        cards: [
          {
            title: "Innovative Solutions",
            description: "Cutting-edge technology tailored to your needs"
          },
          {
            title: "Expert Support",
            description: "24/7 dedicated customer service"
          },
          {
            title: "Proven Results",
            description: "Track record of success with businesses like yours"
          }
        ]
      },
      benefits: {
        title: "Benefits That Matter",
        items: [
          {
            title: "Increased Efficiency",
            description: "Streamline your operations and save valuable time"
          },
          {
            title: "Cost Savings",
            description: "Reduce operational costs and improve ROI"
          },
          {
            title: "Better Outcomes",
            description: "Achieve superior results with our proven solutions"
          }
        ]
      },
      testimonials: {
        title: "What Our Clients Say",
        items: [
          {
            quote: "The results exceeded our expectations",
            author: "John Smith",
            company: "Tech Solutions Inc"
          },
          {
            quote: "A game-changer for our business",
            author: "Sarah Johnson",
            company: "Growth Ventures"
          }
        ]
      },
      pricing: {
        title: "Simple, Transparent Pricing",
        description: "Choose the plan that's right for your business",
        plans: [
          {
            name: "Starter",
            price: "$99/month",
            features: ["Basic Features", "Email Support", "5 Users"]
          },
          {
            name: "Professional",
            price: "$199/month",
            features: ["Advanced Features", "Priority Support", "Unlimited Users"]
          }
        ]
      },
      faq: {
        title: "Frequently Asked Questions",
        description: "Find answers to common questions about our solutions",
        items: expansionMode === 'core_content' ? [
          {
            question: "What makes your solution unique?",
            answer: `Our ${businessName} solution stands out through its innovative approach to ${businessIdea}.`
          },
          {
            question: "How long does implementation take?",
            answer: "Our streamlined process typically enables implementation within 2-4 weeks."
          },
          {
            question: "What kind of support do you offer?",
            answer: "We provide comprehensive 24/7 support to ensure your success."
          }
        ] : expansionMode === 'detailed_expansion' ? [
          {
            question: "What makes your solution unique?",
            answer: `Our ${businessName} solution stands out through its innovative approach to ${businessIdea}. We combine cutting-edge technology with industry expertise to deliver superior results. Our solution has been proven to increase efficiency by up to 45% for our clients.`
          },
          {
            question: "How long does implementation take?",
            answer: "Our streamlined process typically enables implementation within 2-4 weeks. This includes initial setup, team training, and system integration. We provide dedicated support throughout the entire process to ensure a smooth transition."
          },
          {
            question: "What kind of support do you offer?",
            answer: "We provide comprehensive 24/7 support through multiple channels including phone, email, and live chat. Our support team has an average response time of under 2 hours and a 98% satisfaction rate."
          },
          {
            question: "Can your solution scale with my business?",
            answer: "Absolutely! Our platform is designed to scale seamlessly as your business grows. We regularly handle clients from small businesses to enterprise-level organizations."
          },
          {
            question: "What ROI can I expect?",
            answer: "While results vary by implementation, our clients typically see positive ROI within the first 3-6 months. Many report efficiency improvements of 30-50% in their operations."
          }
        ] : [
          {
            question: "What makes your solution unique?",
            answer: `Our ${businessName} solution stands out through its innovative approach to ${businessIdea}. We combine cutting-edge technology with industry expertise to deliver superior results. Our solution has been proven to increase efficiency by up to 45% for our clients. For example, one recent client achieved a 52% reduction in processing time within the first month.`
          },
          {
            question: "How long does implementation take?",
            answer: "Our streamlined process typically enables implementation within 2-4 weeks. This includes initial setup, team training, and system integration. We provide dedicated support throughout the entire process to ensure a smooth transition. Our implementation team has successfully completed over 500 deployments across various industries."
          },
          {
            question: "What kind of support do you offer?",
            answer: "We provide comprehensive 24/7 support through multiple channels including phone, email, and live chat. Our support team has an average response time of under 2 hours and a 98% satisfaction rate. We also offer regular training sessions and a knowledge base with over 200 detailed articles."
          },
          {
            question: "Can your solution scale with my business?",
            answer: "Absolutely! Our platform is designed to scale seamlessly as your business grows. We regularly handle clients from small businesses to enterprise-level organizations. Our largest client processes over 1 million transactions monthly without any performance impact."
          },
          {
            question: "What ROI can I expect?",
            answer: "While results vary by implementation, our clients typically see positive ROI within the first 3-6 months. Many report efficiency improvements of 30-50% in their operations. One mid-sized client saved $150,000 in operational costs within their first year of implementation."
          }
        ]
      }
    };

    const theme_settings = {
      colorScheme: "light",
      typography: {
        headingFont: "Inter",
        bodyFont: "Inter"
      },
      spacing: {
        sectionPadding: "py-16",
        componentGap: "gap-8"
      },
      layout: {
        heroLayout: "centered",
        featuresLayout: "grid",
        benefitsLayout: "grid",
        testimonialsLayout: "grid",
        pricingLayout: "grid"
      }
    };

    const statistics = {
      metrics: [
        { label: "Customers", value: "1000+" },
        { label: "Success Rate", value: "98%" },
        { label: "ROI", value: "3x" }
      ],
      data_points: [
        { label: "Average Implementation Time", value: "2 weeks" },
        { label: "Customer Satisfaction", value: "4.8/5" }
      ]
    };

    // Log the generation
    const { error: logError } = await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        request_payload: { businessName, businessIdea, targetAudience, isRefinement },
        response_payload: { content, theme_settings, statistics },
        success: true,
        status: 'completed',
        step_details: { stage: 'completed', timestamp: new Date().toISOString() }
      });

    if (logError) {
      console.error('Error logging generation:', logError);
    }

    return new Response(
      JSON.stringify({
        content,
        theme_settings,
        statistics
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
