
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Function started');
    
    // Validate request body
    let requestData;
    try {
      const bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      requestData = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { projectId, businessIdea, targetAudience } = requestData;
    console.log('Parsed request payload:', { projectId, businessIdea, targetAudience });

    if (!businessIdea || !targetAudience) {
      return new Response(JSON.stringify({ error: 'Missing required fields in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!Deno.env.get('DEEPSEEK_API_KEY')) {
      return new Response(JSON.stringify({ error: 'DEEPSEEK_API_KEY is not set' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const prompt = generateDetailedPrompt(businessIdea, targetAudience);
    console.log('Generated prompt:', prompt);

    const apiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
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

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('DeepSeek API error response:', errorText);
      return new Response(JSON.stringify({ error: `DeepSeek API error: ${apiResponse.status} ${apiResponse.statusText}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const apiResponseText = await apiResponse.text();
    console.log('Raw API response text:', apiResponseText);

    let data;
    try {
      data = JSON.parse(apiResponseText);
    } catch (parseError) {
      console.error('Failed to parse DeepSeek API response:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON response from DeepSeek API' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!data.choices?.[0]?.message?.content) {
      return new Response(JSON.stringify({ error: 'Invalid response format from DeepSeek API' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let parsedContent;
    try {
      const content = data.choices[0].message.content;
      console.log('Content from API:', content);
      
      parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
      console.log('Successfully parsed content:', parsedContent);

      if (!parsedContent.hero || !parsedContent.value_proposition) {
        throw new Error('Generated content missing required sections');
      }
    } catch (parseError) {
      console.error('Failed to parse content:', parseError);
      return new Response(JSON.stringify({ error: 'Failed to parse generated content' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
