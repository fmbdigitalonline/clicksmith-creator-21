
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts";

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectId, businessName, businessIdea, targetAudience } = await req.json();
    console.log("Received request with:", { projectId, businessName, businessIdea, targetAudience });

    if (!projectId || !businessName) {
      throw new Error('Missing required fields')
    }

    const businessDescription = typeof businessIdea === 'string' ? 
      businessIdea : 
      businessIdea?.description || businessIdea?.valueProposition || '';

    // Enhanced prompt using AIDA formula
    const prompt = `Generate concise, compelling landing page content for "${businessName}" using the AIDA formula:

Business Description: ${businessDescription}
Target Audience: ${targetAudience}

Requirements:
1. Generate 3 alternative hero section titles (max 10 words each)
2. Follow AIDA formula:
   - Attention: Hero section that grabs attention
   - Interest: Value proposition that builds interest
   - Desire: Features and benefits that create desire
   - Action: Clear call to action that drives conversion
3. Include style suggestions:
   - Color scheme
   - Typography recommendations
   - Overall design mood
4. For each section, suggest an appropriate image concept

Format the response as clean JSON with these sections:
- hero (title options array, description, cta)
- value_proposition (title, description, cards[])
- features (title, description, items[])
- proof (testimonials)
- pricing (if applicable)
- finalCta
- footer
- styleGuide (colors, typography, mood)

Keep all content concise and impactful.`;

    console.log("Sending request to DeepSeek");
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a landing page content generator. Return valid JSON only, no markdown formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    console.log("DeepSeek response status:", response.status);
    
    if (!data.choices?.[0]?.message?.content) {
      console.error("Invalid DeepSeek response:", data);
      throw new Error('Invalid response from DeepSeek');
    }

    let content;
    try {
      const cleanedResponse = data.choices[0].message.content
        .trim()
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '');
      
      content = JSON.parse(cleanedResponse);
      
      // If we got title options, use the first one as the main title
      if (Array.isArray(content.hero?.titleOptions)) {
        content.hero.title = content.hero.titleOptions[0];
      }
    } catch (error) {
      console.error("Parse error:", error);
      console.log("Raw content:", data.choices[0].message.content);
      
      content = {
        hero: {
          title: businessName,
          description: businessDescription.split('.')[0],
          cta: "Get Started"
        },
        value_proposition: {
          title: "Why Choose Us",
          description: "We deliver results that matter",
          cards: []
        }
      };
    }

    // Ensure the hero title is not too long
    if (content.hero?.title && content.hero.title.split(' ').length > 12) {
      content.hero.title = businessName;
    }

    // Maintain backward compatibility while adding new features
    const formattedContent = {
      hero: {
        content: {
          title: content.hero?.title || businessName,
          description: content.hero?.description || businessDescription.split('.')[0],
          cta: content.hero?.cta || "Get Started",
          image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
          // Store additional data without breaking existing functionality
          titleOptions: content.hero?.titleOptions || [],
          imageDescription: content.hero?.imageDescription || ""
        },
        layout: "centered"
      },
      value_proposition: {
        content: {
          title: content.value_proposition?.title || "Why Choose Us",
          description: content.value_proposition?.description || "We deliver comprehensive solutions that drive real results",
          cards: Array.isArray(content.value_proposition?.cards) ? content.value_proposition.cards : [
            {
              icon: "✨",
              title: "Quality Solution",
              description: "Experience excellence in every aspect"
            }
          ],
          imageDescription: content.value_proposition?.imageDescription || ""
        },
        layout: "grid"
      },
      features: {
        content: {
          title: content.features?.title || "Key Features",
          description: content.features?.description || "Everything you need to succeed",
          items: Array.isArray(content.features?.items) ? content.features.items : [],
          imageDescription: content.features?.imageDescription || ""
        },
        layout: "grid"
      },
      proof: {
        content: {
          title: content.proof?.title || "What Our Clients Say",
          description: content.proof?.description || "Success stories from businesses like yours",
          items: Array.isArray(content.proof?.items) ? content.proof.items : [],
          imageDescription: content.proof?.imageDescription || ""
        },
        layout: "grid"
      },
      pricing: {
        content: {
          title: content.pricing?.title || "Simple, Transparent Pricing",
          description: content.pricing?.description || "Choose the plan that's right for you",
          items: Array.isArray(content.pricing?.items) ? content.pricing.items : [],
          imageDescription: content.pricing?.imageDescription || ""
        },
        layout: "grid"
      },
      finalCta: {
        content: {
          title: content.finalCta?.title || `Ready to Transform Your Business?`,
          description: content.finalCta?.description || `Join thousands of satisfied customers today.`,
          cta: content.finalCta?.cta || "Get Started Now",
          imageDescription: content.finalCta?.imageDescription || ""
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
      },
      // Add style guide without breaking existing functionality
      styleGuide: content.styleGuide || {
        colors: {
          primary: "#3498DB",
          secondary: "#2ECC71",
          accent: "#E74C3C"
        },
        typography: {
          headingFont: "Montserrat",
          bodyFont: "Inter",
          mood: "Modern and professional"
        }
      }
    };

    console.log("Returning formatted content with title length:", formattedContent.hero.content.title.length);
    
    return new Response(
      JSON.stringify(formattedContent),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
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
    );
  }
});
