
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const generateDetailedPrompt = (businessName: string, businessIdea: any, targetAudience: any) => {
  return `Create a landing page content structure with the following details:

Business: ${businessName}
Concept: ${businessIdea?.description || 'N/A'}
Target: ${targetAudience?.name || 'N/A'}
Message: ${targetAudience?.coreMessage || 'N/A'}

Generate the following sections as JSON:
{
  "hero": {
    "title": "Main headline focusing on ${targetAudience?.marketingAngle || 'value proposition'}",
    "description": "Subtitle addressing ${targetAudience?.painPoints?.[0] || 'main pain point'}",
    "cta": "Action-oriented button text",
    "image": "Hero image description"
  },
  "value_proposition": {
    "title": "Value-focused title",
    "description": "Benefits overview",
    "cards": [
      {
        "title": "Benefit 1",
        "description": "Detailed benefit description",
        "icon": "Relevant emoji"
      }
    ]
  }
}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Function started')
    const { projectId, businessName, businessIdea, targetAudience } = await req.json()
    console.log('Request payload:', { projectId, businessName })

    const prompt = generateDetailedPrompt(businessName, businessIdea, targetAudience)
    console.log('Generated prompt')

    const apiResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
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
            content: "You are a landing page content creator. Return JSON responses only."
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

    console.log('API Status:', apiResponse.status)
    const data = await apiResponse.json()
    console.log('API Response received')

    if (!data || !data.choices || !data.choices[0]?.message?.content) {
      console.error('Invalid API response:', data)
      throw new Error('Invalid API response structure')
    }

    // Default content structure
    const defaultContent = {
      hero: {
        title: `Transform Your Career with ${businessName}`,
        description: `Ready to turn your corporate experience into entrepreneurial success? ${businessName} helps you make the transition seamlessly.`,
        cta: "Start Your Journey",
        image: "Professional transitioning from corporate to entrepreneur"
      },
      value_proposition: {
        title: "Why Choose Us",
        description: "We understand the challenges of transitioning from corporate life to entrepreneurship.",
        cards: [
          {
            title: "Quick Start",
            description: "Transform your business idea into a comprehensive plan in minutes, not months.",
            icon: "🚀"
          },
          {
            title: "Expert Guidance",
            description: "Built-in best practices from successful corporate-to-entrepreneur transitions.",
            icon: "💡"
          },
          {
            title: "Time-Saving Tools",
            description: "All the tools and resources you need in one place, designed for busy professionals.",
            icon: "⏰"
          }
        ]
      },
      features: {
        title: "Features Built for Your Success",
        description: "Everything you need to make your transition smooth and successful.",
        items: [
          {
            title: "One-Click Business Planning",
            description: "Generate comprehensive business plans instantly, tailored to your industry and goals.",
            icon: "📝"
          },
          {
            title: "Risk Assessment Tools",
            description: "Evaluate and minimize risks in your transition from corporate to entrepreneurship.",
            icon: "🎯"
          },
          {
            title: "Time Management Solutions",
            description: "Efficiently balance your current job with your entrepreneurial journey.",
            icon: "⚡"
          }
        ]
      }
    }

    try {
      // Attempt to parse AI response
      const aiContent = JSON.parse(data.choices[0].message.content.trim())
      console.log('Successfully parsed AI content')
      
      // Merge AI content with default content for missing sections
      const finalContent = {
        ...defaultContent,
        ...aiContent
      }

      return new Response(JSON.stringify(finalContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Fall back to default content
      return new Response(JSON.stringify(defaultContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Error in edge function:', error)
    
    // Return a proper error response with CORS headers
    return new Response(JSON.stringify({
      error: error.message,
      details: 'Error generating landing page content'
    }), {
      status: 200, // Return 200 even for errors to avoid CORS issues
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
