
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts";

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Request received");
    const { projectId, businessName, businessIdea, targetAudience } = await req.json();
    console.log("Request payload:", { projectId, businessName, businessIdea, targetAudience });

    // Validate required fields
    if (!projectId || !businessName) {
      throw new Error('Missing required fields')
    }

    // Create basic prompt
    const prompt = `Create a landing page content for a business called "${businessName}". 
    Business description: ${businessIdea}
    Target audience: ${targetAudience}
    
    Generate JSON content for a landing page with the following sections:
    - Hero section with headline, description, and CTA
    - Value proposition with key benefits
    - Features section
    - Social proof/testimonials
    - Pricing section
    - Final call-to-action
    - Footer

    Return strictly valid JSON with no markdown formatting.`

    console.log("Sending request to DeepSeek");
    // Call DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{
          role: "system",
          content: "You are a landing page content generator. Return only valid JSON data without any markdown."
        }, {
          role: "user",
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    const data = await response.json()
    console.log("DeepSeek raw response:", data);
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('No response from DeepSeek')
    }

    let content;
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = data.choices[0].message.content.trim()
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '');
      
      console.log("Cleaned response:", cleanedResponse);
      content = JSON.parse(cleanedResponse);
      console.log("Parsed content:", content);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.log('Raw content:', data.choices[0].message.content);
      throw new Error('Failed to parse DeepSeek response as JSON');
    }

    // Format the content to match the expected structure
    const formattedContent = {
      hero: {
        content: {
          title: content.hero?.title || businessName,
          description: content.hero?.description || businessIdea,
          cta: content.hero?.cta || "Get Started",
          image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
        },
        layout: "centered"
      },
      value_proposition: {
        content: {
          title: content.value_proposition?.title || "Why Choose Us",
          description: content.value_proposition?.description || "We deliver comprehensive solutions that drive real results",
          cards: content.value_proposition?.cards || [
            {
              icon: "✨",
              title: "Quality Product",
              description: "Experience superior quality in every aspect of our service"
            }
          ]
        },
        layout: "grid"
      },
      features: {
        content: {
          title: content.features?.title || "Features",
          description: content.features?.description || "Key features of our platform",
          items: content.features?.items || []
        },
        layout: "grid"
      },
      proof: {
        content: {
          title: content.proof?.title || "What Our Clients Say",
          description: content.proof?.description || "Success stories from businesses like yours",
          items: content.proof?.items || []
        },
        layout: "grid"
      },
      pricing: {
        content: {
          title: content.pricing?.title || "Simple, Transparent Pricing",
          description: content.pricing?.description || "Choose the plan that's right for you",
          items: content.pricing?.items || []
        },
        layout: "grid"
      },
      finalCta: {
        content: {
          title: content.finalCta?.title || "Ready to Get Started?",
          description: content.finalCta?.description || "Join us today and transform your business",
          cta: content.finalCta?.cta || "Get Started Now"
        },
        layout: "centered"
      },
      footer: {
        content: {
          links: {
            company: ["About", "Contact", "Careers"],
            resources: ["Blog", "Help Center", "Support"]
          },
          copyright: `© ${new Date().getFullYear()} All rights reserved.`
        },
        layout: "grid"
      }
    };

    console.log("Final formatted content:", formattedContent);

    // Return the formatted content with CORS headers
    return new Response(
      JSON.stringify(formattedContent),
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
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
