
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts"

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

    // Initialize OpenAI client with DeepSeek configuration
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: Deno.env.get('DEEPSEEK_API_KEY') || '',
    });

    console.log('Initialized OpenAI client with DeepSeek configuration')

    try {
      const completion = await openai.chat.completions.create({
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
        temperature: 0.7,
        max_tokens: 4000,
      });

      console.log('Received response from DeepSeek API')
      
      const content = completion.choices[0].message.content;
      console.log('Successfully extracted content from response')

      try {
        // Parse the AI response
        const aiContent = JSON.parse(content.trim())
        console.log('Successfully parsed AI content')

        return new Response(JSON.stringify(aiContent), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        throw new Error('Failed to parse AI response')
      }
    } catch (apiError) {
      console.error('DeepSeek API error:', apiError)
      throw new Error('Failed to generate content from DeepSeek API')
    }

  } catch (error) {
    console.error('Error in edge function:', error)
    
    // Return default content structure on error
    const defaultContent = {
      hero: {
        title: `Transform Your Business with ${businessName}`,
        description: "Experience the next level of business growth with our innovative solutions",
        cta: "Get Started Now",
        image: "Professional business growth illustration"
      },
      value_proposition: {
        title: "Why Choose Us",
        description: "We deliver exceptional results through proven strategies",
        cards: [
          {
            title: "Expert Solutions",
            description: "Tailored approaches for your unique business needs",
            icon: "💡"
          },
          {
            title: "Proven Results",
            description: "Track record of successful implementations",
            icon: "📈"
          },
          {
            title: "Dedicated Support",
            description: "24/7 assistance for your business growth",
            icon: "🤝"
          }
        ]
      }
    }

    return new Response(JSON.stringify({
      content: defaultContent,
      error: error.message
    }), {
      status: 200, // Return 200 even for errors to avoid CORS issues
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
