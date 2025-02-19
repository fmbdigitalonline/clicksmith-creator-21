
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

const generateDetailedPrompt = (businessIdea: any, targetAudience: any) => {
  return `Please generate landing page content in JSON format with the following structure:

EXAMPLE JSON OUTPUT:
{
  "hero": {
    "title": "Transform Your Vision Into Reality",
    "description": "Compelling subtitle about the value proposition",
    "cta": "Action-oriented button text",
    "image": "Description of hero image"
  },
  "value_proposition": {
    "title": "Why Choose Us",
    "description": "Overview of benefits",
    "cards": [
      {
        "title": "Key Benefit",
        "description": "Detailed explanation",
        "icon": "📈"
      }
    ]
  }
}

Business Details:
- Concept: ${businessIdea?.description || 'N/A'}
- Value Proposition: ${businessIdea?.valueProposition || 'N/A'}
- Target Audience: ${targetAudience?.name || 'N/A'}
- Core Message: ${targetAudience?.coreMessage || 'N/A'}
- Marketing Angle: ${targetAudience?.marketingAngle || 'N/A'}
- Pain Points: ${targetAudience?.painPoints?.join(', ') || 'N/A'}`
}

serve(async (req) => {
  // Always respond to OPTIONS requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Function started');
    const requestData = await req.json();
    const { projectId, businessIdea, targetAudience } = requestData;
    console.log('Request payload:', { projectId, businessIdea, targetAudience });

    if (!Deno.env.get('DEEPSEEK_API_KEY')) {
      throw new Error('DEEPSEEK_API_KEY is not set');
    }

    const prompt = generateDetailedPrompt(businessIdea, targetAudience);
    console.log('Generated prompt:', prompt);

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
            content: "You are a landing page content creator. Generate engaging and compelling content based on the business details provided. Return content in valid JSON format following the exact structure provided."
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

    try {
      const content = data.choices[0].message.content;
      console.log('Content from API:', content);
      
      const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
      console.log('Successfully parsed content:', parsedContent);

      if (!parsedContent.hero || !parsedContent.value_proposition) {
        throw new Error('Generated content missing required sections');
      }

      return new Response(JSON.stringify(parsedContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      return new Response(JSON.stringify({ error: parseError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
