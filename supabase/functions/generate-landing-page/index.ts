
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const generateContent = async (businessIdea: any, targetAudience: any, iterationNumber: number = 1) => {
  // Create a structured content object following the landing page formula
  const content = {
    sections: [
      {
        type: 'hero',
        order: 1,
        layout: {
          style: 'split',
          width: 'contained',
          background: 'gradient'
        },
        style: {
          colorScheme: 'light',
          typography: {
            headingSize: 'xlarge'
          }
        },
        content: {
          title: `Transform Your ${businessIdea.industry || 'Business'} with Innovative Solutions`,
          subtitle: `Perfect for ${targetAudience.description || 'businesses'} looking to grow and succeed`,
          mainDescription: `${businessIdea.description} We understand the unique challenges faced by ${targetAudience.description} and have developed comprehensive solutions to address your specific needs.`,
          paragraphs: [
            {
              text: `In today's competitive ${businessIdea.industry} landscape, standing out is more crucial than ever. Our solution is specifically designed to help you overcome common challenges and achieve remarkable results.`,
              emphasis: true
            }
          ],
          primaryCta: {
            text: "Get Started Now",
            description: "Start your journey today"
          },
          secondaryCta: {
            text: "Learn More",
            description: "See how it works"
          }
        }
      },
      {
        type: 'social-proof',
        order: 2,
        layout: {
          style: 'grid',
          width: 'contained'
        },
        style: {
          colorScheme: 'light',
          textAlign: 'center'
        },
        content: {
          title: "Trusted by Leading Companies",
          subtitle: "Join hundreds of successful businesses who have already transformed their operations",
          items: [
            { title: "50+", description: "Satisfied Clients\nAcross Multiple Industries" },
            { title: "98%", description: "Customer Satisfaction\nBased on Recent Surveys" },
            { title: "24/7", description: "Support Available\nDedicated Customer Service" }
          ],
          paragraphs: [
            {
              text: "Our track record speaks for itself. We've helped businesses like yours achieve remarkable results through our innovative solutions and dedicated support.",
              emphasis: true
            }
          ]
        }
      },
      {
        type: 'value-proposition',
        order: 3,
        layout: {
          style: 'grid',
          width: 'contained'
        },
        style: {
          colorScheme: 'light'
        },
        content: {
          title: "Why Choose Us",
          subtitle: `We understand the unique challenges of ${businessIdea.industry || 'your industry'}`,
          mainDescription: `Our comprehensive solution is specifically designed to address the pain points commonly faced by ${targetAudience.description}. We've developed our services based on years of industry experience and direct feedback from clients like you.`,
          items: [
            {
              title: "Expert Solutions",
              description: "Our team brings decades of combined experience to every project. We don't just provide services - we deliver comprehensive solutions tailored to your specific needs and goals.",
              highlights: ["Professional", "Customized", "Efficient"],
              details: [
                "In-depth industry knowledge",
                "Customized approach for each client",
                "Proven methodologies and best practices"
              ]
            },
            {
              title: "Proven Results",
              description: "We measure our success by your success. Our data-driven approach ensures that you can see the tangible impact of our solutions on your business growth.",
              highlights: ["Data-Driven", "Measurable", "Impactful"],
              details: [
                "Regular performance reports",
                "Clear success metrics",
                "Continuous optimization"
              ]
            },
            {
              title: "Dedicated Support",
              description: "Our commitment to your success goes beyond implementation. We provide ongoing support and guidance to ensure you achieve optimal results.",
              highlights: ["24/7", "Responsive", "Knowledgeable"],
              details: [
                "Round-the-clock assistance",
                "Proactive problem solving",
                "Expert consultation"
              ]
            }
          ],
          bulletPoints: [
            "Tailored strategies that align with your business goals",
            "Comprehensive support throughout your journey",
            "Proven track record of success in your industry",
            "Innovative solutions backed by latest technology"
          ]
        }
      },
      {
        type: 'features',
        order: 4,
        layout: {
          style: 'columns',
          width: 'contained',
          spacing: 'spacious'
        },
        style: {
          colorScheme: 'light'
        },
        content: {
          title: "Comprehensive Features & Benefits",
          subtitle: "Everything you need to succeed in today's competitive landscape",
          mainDescription: `Our feature set is specifically designed to address the unique challenges faced by ${targetAudience.description}. Each feature has been carefully developed based on real-world feedback and industry best practices.`,
          items: [
            {
              title: "Comprehensive Solutions",
              description: "End-to-end service tailored to your needs, ensuring every aspect of your business is optimized for success.",
              details: [
                "Customized strategies for your specific industry",
                "Flexible options that grow with your business",
                "Scalable solutions for future expansion",
                "Integration with existing systems"
              ]
            },
            {
              title: "Expert Support",
              description: "Our team of industry experts provides guidance and support throughout your journey, ensuring optimal results.",
              details: [
                "Dedicated account management team",
                "Regular strategy review sessions",
                "Priority support response",
                "Ongoing optimization and improvements"
              ]
            },
            {
              title: "Advanced Analytics",
              description: "Get deep insights into your performance with our comprehensive analytics and reporting tools.",
              details: [
                "Real-time performance tracking",
                "Custom reporting dashboards",
                "Trend analysis and forecasting",
                "ROI measurement tools"
              ]
            }
          ],
          paragraphs: [
            {
              heading: "Tailored to Your Needs",
              text: `Our solutions are specifically designed for ${targetAudience.description}, taking into account your unique challenges and goals.`,
              emphasis: true
            },
            {
              heading: "Future-Proof Solutions",
              text: "We continuously update and enhance our offerings to ensure you stay ahead of industry trends and changes."
            }
          ]
        }
      },
      {
        type: 'testimonials',
        order: 5,
        layout: {
          style: 'grid',
          width: 'narrow'
        },
        style: {
          colorScheme: 'light'
        },
        content: {
          title: "Success Stories from Our Clients",
          subtitle: "Read how we've helped businesses like yours achieve their goals",
          items: [
            {
              title: "Transformed Our Business",
              description: "Working with this team has completely transformed how we operate. The results have exceeded our expectations in every way.",
              details: ["Sarah Johnson", "CEO, Industry Leader"],
              highlights: ["200% Growth", "Improved Efficiency"]
            },
            {
              title: "Outstanding Results",
              description: "The level of expertise and dedication they brought to our project was exceptional. We've seen remarkable improvements in our operations.",
              details: ["Michael Chen", "Operations Director"],
              highlights: ["Reduced Costs", "Increased Productivity"]
            },
            {
              title: "Game-Changing Partnership",
              description: "Their innovative solutions and dedicated support have made them an invaluable partner in our growth journey.",
              details: ["Emma Rodriguez", "Marketing Manager"],
              highlights: ["Increased ROI", "Better Engagement"]
            }
          ],
          paragraphs: [
            {
              text: "These success stories represent just a few examples of the results we've helped our clients achieve. Every business is unique, and we're committed to helping you write your own success story.",
              emphasis: true
            }
          ]
        }
      },
      {
        type: 'faq',
        order: 6,
        layout: {
          width: 'contained',
          style: 'grid'
        },
        style: {
          colorScheme: 'light'
        },
        content: {
          title: "Frequently Asked Questions",
          subtitle: "Get answers to common questions about our solutions",
          items: [
            {
              title: "How quickly can we see results?",
              description: "While results can vary, most clients start seeing positive changes within the first few weeks of implementation. Our systematic approach ensures steady progress towards your goals."
            },
            {
              title: "What kind of support do you provide?",
              description: "We offer comprehensive 24/7 support including dedicated account management, regular check-ins, and priority technical assistance. Your success is our top priority."
            },
            {
              title: "How do you ensure quality?",
              description: "We maintain high standards through rigorous quality control processes, regular audits, and continuous improvement based on client feedback and industry best practices."
            }
          ]
        }
      },
      {
        type: 'cta',
        order: 7,
        layout: {
          width: 'contained',
          background: 'gradient'
        },
        style: {
          colorScheme: 'light',
          textAlign: 'center'
        },
        content: {
          title: "Ready to Transform Your Business?",
          subtitle: "Join our community of successful businesses and start your journey to growth today",
          mainDescription: "Take the first step towards transforming your business. Our team is ready to help you achieve your goals.",
          paragraphs: [
            {
              text: "Don't wait to improve your business. Join our satisfied clients and experience the difference our solutions can make.",
              emphasis: true
            }
          ],
          primaryCta: {
            text: "Start Your Journey",
            description: "No credit card required"
          },
          secondaryCta: {
            text: "Schedule a Demo",
            description: "See our solutions in action"
          }
        }
      }
    ]
  };

  return content;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, businessIdea, targetAudience, userId, iterationNumber } = await req.json();
    
    console.log('Generating content for project:', projectId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Log the generation start
    const { data: logData, error: logError } = await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        status: 'generation_started',
        step_details: { stage: 'started', timestamp: new Date().toISOString() },
        request_payload: { businessIdea, targetAudience }
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`Error logging generation start: ${logError.message}`);
    }

    // Generate the content
    const content = await generateContent(businessIdea, targetAudience, iterationNumber);

    // Update or create the landing page
    const { data: landingPage, error: upsertError } = await supabase
      .from('landing_pages')
      .upsert({
        project_id: projectId,
        user_id: userId,
        content,
        content_iterations: iterationNumber,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (upsertError) {
      throw new Error(`Error upserting landing page: ${upsertError.message}`);
    }

    // Log successful generation
    await supabase
      .from('landing_page_generation_logs')
      .update({
        status: 'completed',
        success: true,
        step_details: { stage: 'completed', timestamp: new Date().toISOString() },
        response_payload: content
      })
      .eq('id', logData.id);

    return new Response(
      JSON.stringify({ success: true, content: landingPage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
