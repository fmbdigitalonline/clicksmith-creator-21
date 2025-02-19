
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

const cleanJsonString = (str: string) => {
  try {
    // Remove markdown code block syntax
    str = str.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    // Remove any leading/trailing whitespace
    str = str.trim();
    // Try parsing and stringifying to validate and format JSON
    const parsed = JSON.parse(str);
    return JSON.stringify(parsed);
  } catch (error) {
    console.error('Error cleaning JSON string:', error);
    throw new Error('Invalid JSON format in API response');
  }
};

const generateDetailedPrompt = (businessIdea: any, targetAudience: any) => {
  return `You are a landing page content generator. Create a JSON structure (and ONLY JSON, no other text) for a landing page. Use this business context:

Business Idea: ${JSON.stringify(businessIdea)}
Target Audience: ${JSON.stringify(targetAudience)}

The response must be valid JSON with this structure:
{
  "hero": {
    "title": "A compelling headline for ${businessIdea.name || 'the business'}",
    "description": "A clear, engaging subtitle",
    "cta": "Action-oriented button text",
    "image": "Description of ideal hero image"
  },
  "value_proposition": {
    "title": "Why Choose Us",
    "description": "Overview of benefits",
    "cards": [
      {
        "title": "Benefit 1",
        "description": "Explanation",
        "icon": "✨"
      }
    ]
  },
  "features": {
    "title": "Features",
    "description": "What we offer",
    "items": [
      {
        "title": "Feature 1",
        "description": "Description",
        "icon": "🎯"
      }
    ]
  },
  "proof": {
    "title": "Testimonials",
    "description": "What clients say",
    "items": [
      {
        "quote": "A testimonial",
        "author": "Name",
        "role": "Position",
        "company": "Company"
      }
    ]
  },
  "pricing": {
    "title": "Pricing",
    "description": "Choose your plan",
    "items": [
      {
        "name": "Basic",
        "price": "$X/month",
        "description": "Description",
        "features": ["Feature 1", "Feature 2"]
      }
    ]
  },
  "finalCta": {
    "title": "Get Started",
    "description": "Take action now",
    "cta": "Start Now"
  },
  "footer": {
    "content": {
      "links": {
        "company": ["About", "Contact"],
        "resources": ["Help", "Support"]
      },
      "copyright": "Copyright notice"
    }
  }
}`
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectId, businessIdea, targetAudience } = await req.json();
    
    if (!businessIdea || !targetAudience) {
      console.error('Missing required fields:', { businessIdea, targetAudience });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    if (!DEEPSEEK_API_KEY) {
      console.error('Missing DEEPSEEK_API_KEY');
      return new Response(
        JSON.stringify({ error: 'Missing API configuration' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    console.log('Generating content with business context:', {
      businessIdea,
      targetAudience
    });

    const prompt = generateDetailedPrompt(businessIdea, targetAudience);
    console.log('Generated prompt:', prompt);

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a landing page content creator. Generate ONLY valid JSON content with NO markdown formatting or additional text."
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
      const errorText = await response.text();
      console.error('DeepSeek API error:', errorText);
      throw new Error(`DeepSeek API returned ${response.status}: ${errorText}`);
    }

    const rawResponse = await response.text();
    console.log('Raw DeepSeek API response:', rawResponse);

    let result;
    try {
      result = JSON.parse(rawResponse);
    } catch (error) {
      console.error('Failed to parse DeepSeek API response:', error);
      throw new Error('Invalid JSON response from DeepSeek API');
    }

    if (!result.choices?.[0]?.message?.content) {
      console.error('Unexpected API response structure:', result);
      throw new Error('Invalid response format from DeepSeek API');
    }

    const content = result.choices[0].message.content;
    console.log('API response content:', content);

    const cleanedContent = cleanJsonString(content);
    console.log('Cleaned content:', cleanedContent);
    
    const parsedContent = JSON.parse(cleanedContent);
    
    if (!parsedContent.hero || !parsedContent.value_proposition) {
      console.error('Missing required sections in generated content:', parsedContent);
      throw new Error('Generated content missing required sections');
    }

    return new Response(
      cleanedContent,
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('Error in edge function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
