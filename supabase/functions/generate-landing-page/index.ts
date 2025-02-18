
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts";

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectId, businessName, businessIdea, targetAudience, template, existingContent, layoutStyle } = await req.json()

    // Validate required fields
    if (!projectId || !businessName) {
      throw new Error('Missing required fields')
    }

    // Create basic prompt
    const prompt = `Create a landing page content for a business called "${businessName}". 
    Business description: ${businessIdea}
    Target audience: ${targetAudience}
    
    Generate content for each section of the landing page in a consistent format including:
    1. Hero section with a compelling headline, description, and CTA
    2. Value proposition section highlighting key benefits
    3. Features section showcasing main product/service features
    4. Proof/testimonials section
    5. Pricing section if applicable
    6. Final call-to-action section
    7. Footer section with basic information

    IMPORTANT: Return ONLY the JSON content without any markdown formatting or code blocks. The response should start with { and end with }.
    The JSON should follow this exact structure:
    {
      "hero": {
        "title": "compelling headline",
        "description": "engaging description",
        "cta": "call to action text"
      },
      "value_proposition": {
        "title": "section title",
        "description": "section description",
        "cards": [
          {
            "title": "benefit title",
            "description": "benefit description",
            "icon": "✨"
          }
        ]
      },
      "features": {
        "title": "Features section title",
        "description": "Features section description",
        "items": [
          {
            "title": "feature name",
            "description": "feature description",
            "icon": "🎯"
          }
        ]
      },
      "proof": {
        "title": "Social proof section title",
        "description": "Social proof section description",
        "items": [
          {
            "quote": "testimonial text",
            "author": "person name",
            "role": "job title",
            "company": "company name"
          }
        ]
      },
      "pricing": {
        "title": "Pricing section title",
        "description": "Pricing section description",
        "items": [
          {
            "name": "plan name",
            "price": "price amount",
            "features": ["feature 1", "feature 2"]
          }
        ]
      },
      "finalCta": {
        "title": "CTA section title",
        "description": "CTA description",
        "buttonText": "button text"
      },
      "footer": {
        "links": {
          "company": ["About", "Contact", "Careers"],
          "resources": ["Blog", "Help Center", "Support"]
        }
      }
    }`

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
          content: "You are a landing page content generator. Always return pure JSON without any markdown formatting."
        }, {
          role: "user",
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 3000
      })
    })

    const data = await response.json()
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('No response from DeepSeek')
    }

    let content;
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = data.choices[0].message.content.trim()
        .replace(/^```json\s*/, '')  // Remove leading ```json if present
        .replace(/\s*```$/, '')      // Remove trailing ``` if present
      
      content = JSON.parse(cleanedResponse)
      console.log("Parsed content:", content);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.log('Raw content:', data.choices[0].message.content)
      throw new Error('Failed to parse DeepSeek response as JSON')
    }

    // Ensure consistent field structure
    const formattedContent = {
      hero: {
        content: {
          title: content.hero?.title || businessName,
          description: content.hero?.description || businessIdea,
          cta: content.hero?.cta || "Get Started",
          image: existingContent?.hero?.content?.image || null
        },
        layout: "centered"
      },
      value_proposition: {
        content: content.value_proposition || content.valueProposition || {
          title: "Why Choose Us",
          description: "We deliver comprehensive solutions that drive real results",
          cards: []
        },
        layout: "grid"
      },
      features: {
        content: content.features || {
          title: "Features",
          description: "Key features of our platform",
          items: []
        },
        layout: "grid"
      },
      proof: {
        content: content.proof || content.testimonials || {
          title: "What Our Clients Say",
          items: []
        },
        layout: "grid"
      },
      pricing: {
        content: content.pricing || {
          title: "Simple, Transparent Pricing",
          description: "Choose the plan that's right for you",
          items: []
        },
        layout: "grid"
      },
      finalCta: {
        content: content.finalCta || content.cta || {
          title: "Ready to Get Started?",
          description: "Join us today and transform your business",
          buttonText: "Get Started Now"
        },
        layout: "centered"
      },
      footer: {
        content: content.footer || {
          links: {
            company: ["About", "Contact", "Careers"],
            resources: ["Blog", "Help Center", "Support"]
          },
          copyright: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`
        },
        layout: "grid"
      }
    }

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
      JSON.stringify({ error: error.message }),
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
