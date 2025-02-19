
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const generatePrompt = (businessName: string, businessIdea: any, targetAudience: any) => {
  return `Generate a complete landing page content structure following the format below. Create compelling copy for a business named "${businessName}".

Business Concept: ${businessIdea?.description || "A new innovative business"}
Target Audience: ${targetAudience?.demographics || "General audience"}
Core Message: ${targetAudience?.coreMessage || "Delivering value to customers"}

Generate the following sections:

1. Hero Section:
- Create a powerful headline that captures attention
- Write a compelling subtitle that explains the value proposition
- Include a clear call-to-action button text
- Suggest an image concept that represents the business visually

2. Value Proposition Section:
- Create a section title
- Write a brief section description
- Generate 3 value proposition cards, each with:
  * A benefit title
  * A detailed description
  * An appropriate icon suggestion

3. Features Section:
- Create a section title
- Write a section description
- Generate 3 key features, each with:
  * Feature name
  * Detailed explanation
  * Visual representation suggestion

4. Proof Section (Testimonials):
- Create 2-3 compelling testimonials with:
  * The testimonial quote
  * Customer name
  * Role/Position
  * Company name

5. Pricing Section:
- Create 2-3 pricing tiers, each with:
  * Plan name
  * Price point
  * 4-5 key features/benefits
  * Recommended tier indicator

6. Final Call-to-Action:
- Create a compelling headline
- Write a persuasive description
- Suggest an action-oriented button text

7. Footer:
- List 3-4 company links
- List 3-4 resource links
- Include a copyright notice

Use modern, engaging language that resonates with ${targetAudience?.demographics || "the target audience"}. Focus on addressing their pain points and desires.`
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { projectId, businessName, businessIdea, targetAudience } = await req.json()
    
    const prompt = generatePrompt(businessName, businessIdea, targetAudience)
    
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('DEEPSEEK_API_KEY')}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a landing page content generator. You create compelling, conversion-focused content structured in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    const data = await response.json()
    console.log('DeepSeek API response:', data)

    // Parse and structure the response
    const content = data.choices[0].message.content
    
    try {
      // Try to parse as JSON first
      const parsedContent = JSON.parse(content)
      return new Response(JSON.stringify(parsedContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (e) {
      // If not JSON, structure it ourselves
      const structured = {
        hero: {
          title: "Welcome to " + businessName,
          description: "Transform your business with our innovative solution",
          cta: "Get Started",
          image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
        },
        value_proposition: {
          title: "Why Choose Us",
          description: "We deliver comprehensive solutions that drive real results",
          cards: [
            {
              title: "Quality Service",
              description: "Best-in-class service tailored to your needs",
              icon: "✨"
            },
            {
              title: "Innovative Solutions",
              description: "Cutting-edge technology for optimal results",
              icon: "🚀"
            },
            {
              title: "Expert Support",
              description: "24/7 dedicated support from our team of experts",
              icon: "👥"
            }
          ]
        },
        features: {
          title: "Powerful Features",
          description: "Everything you need to succeed",
          items: [
            {
              title: "Easy Integration",
              description: "Seamlessly integrate with your existing workflow",
              icon: "🔄"
            },
            {
              title: "Advanced Analytics",
              description: "Get detailed insights into your performance",
              icon: "📊"
            },
            {
              title: "Secure Platform",
              description: "Enterprise-grade security for your peace of mind",
              icon: "🔒"
            }
          ]
        },
        proof: {
          title: "What Our Clients Say",
          description: "Success stories from businesses like yours",
          items: [
            {
              quote: "This solution has transformed how we operate",
              author: "Sarah Chen",
              role: "CEO",
              company: "Tech Innovations"
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
          title: "Ready to Get Started?",
          description: "Join thousands of satisfied customers today",
          buttonText: "Start Now"
        },
        footer: {
          links: {
            company: ["About", "Contact", "Careers"],
            resources: ["Blog", "Help Center", "Support"]
          },
          copyright: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`
        }
      }
      
      return new Response(JSON.stringify(structured), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
