
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const generateDetailedPrompt = (businessIdea: any, targetAudience: any) => {
  // Extract business name from value proposition or description
  const businessName = businessIdea?.valueProposition?.split(':')[1]?.trim() || 
                      businessIdea?.description?.split(' ').slice(0, 3).join(' ') ||
                      'Your Business';

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

  let requestData;
  try {
    console.log('Function started')
    requestData = await req.json()
    const { projectId, businessIdea, targetAudience } = requestData
    console.log('Request payload:', { projectId, businessIdea })

    if (!Deno.env.get('DEEPSEEK_API_KEY')) {
      throw new Error('DEEPSEEK_API_KEY is not set')
    }

    const prompt = generateDetailedPrompt(businessIdea, targetAudience)
    console.log('Generated prompt:', prompt)

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('DEEPSEEK_API_KEY')}`,
          'Content-Type': 'application/json',
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
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('DeepSeek API error response:', errorData);
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data);

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from DeepSeek API');
      }

      const content = data.choices[0].message.content;
      console.log('Content from API:', content);

      try {
        // Parse the AI response
        const aiContent = JSON.parse(content.trim());
        console.log('Successfully parsed AI content');

        return new Response(JSON.stringify(aiContent), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError, 'Content:', content);
        throw new Error(`Failed to parse AI response: ${parseError.message}`);
      }
    } catch (apiError) {
      console.error('API error:', apiError);
      throw apiError;
    }

  } catch (error) {
    console.error('Error in edge function:', error);
    
    // Get business name from business idea for fallback content
    const businessName = requestData?.businessIdea?.valueProposition?.split(':')[1]?.trim() || 
                        requestData?.businessIdea?.description?.split(' ').slice(0, 3).join(' ') ||
                        'Your Business';
    
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
    };

    return new Response(JSON.stringify({
      content: defaultContent,
      error: error.message
    }), {
      status: 200, // Return 200 even for errors to avoid CORS issues
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
