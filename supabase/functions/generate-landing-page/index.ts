
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

const extractJsonFromString = (str: string): string => {
  try {
    // Try to find JSON-like content between curly braces
    const match = str.match(/\{[\s\S]*\}/);
    if (match) {
      const jsonStr = match[0];
      // Validate that it's parseable
      JSON.parse(jsonStr);
      return jsonStr;
    }
    throw new Error('No valid JSON found in string');
  } catch (error) {
    console.error('Error extracting JSON:', error);
    throw new Error(`Failed to extract valid JSON: ${error.message}`);
  }
};

const generateDetailedPrompt = (businessIdea: any, targetAudience: any) => {
  return `Return ONLY a JSON object (no additional text or explanation) for a landing page with these details:

Business Description: ${businessIdea?.description || 'Not specified'}
Value Proposition: ${businessIdea?.valueProposition || 'Not specified'}
Target Audience: ${JSON.stringify(targetAudience)}

Return this exact JSON structure:
{
  "hero": {
    "title": "Main headline",
    "description": "Subheadline",
    "cta": "Button text",
    "image": "Hero image description"
  },
  "value_proposition": {
    "title": "Value Title",
    "description": "Value Description",
    "cards": [
      {
        "title": "Value Point",
        "description": "Value Explanation",
        "icon": "✨"
      }
    ]
  },
  "features": {
    "title": "Features Title",
    "description": "Features Overview",
    "items": [
      {
        "title": "Feature Name",
        "description": "Feature Details",
        "icon": "🎯"
      }
    ]
  },
  "proof": {
    "title": "Social Proof",
    "description": "Testimonials Intro",
    "items": [
      {
        "quote": "Testimonial text",
        "author": "Author Name",
        "role": "Position",
        "company": "Company"
      }
    ]
  },
  "pricing": {
    "title": "Pricing Title",
    "description": "Pricing Description",
    "items": [
      {
        "name": "Plan Name",
        "price": "Price Amount",
        "description": "Plan Details",
        "features": ["Feature 1", "Feature 2"]
      }
    ]
  },
  "finalCta": {
    "title": "CTA Title",
    "description": "CTA Description",
    "cta": "CTA Button Text"
  },
  "footer": {
    "content": {
      "links": {
        "company": ["About", "Contact"],
        "resources": ["Help", "Support"]
      },
      "copyright": "Copyright text"
    }
  }
}`
};

serve(async (req) => {
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

    console.log('Starting content generation with:', {
      projectId,
      businessIdea: JSON.stringify(businessIdea),
      targetAudience: JSON.stringify(targetAudience)
    });

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
            content: "You are a JSON generator. Only return valid JSON objects, no other text or formatting."
          },
          {
            role: "user",
            content: generateDetailedPrompt(businessIdea, targetAudience)
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error response:', errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const rawResponse = await response.text();
    console.log('Raw DeepSeek response:', rawResponse);

    let result;
    try {
      result = JSON.parse(rawResponse);
    } catch (error) {
      console.error('Failed to parse raw response:', error);
      // Try to extract JSON from the response
      const extracted = extractJsonFromString(rawResponse);
      result = JSON.parse(extracted);
    }

    if (!result.choices?.[0]?.message?.content) {
      console.error('Invalid API response structure:', result);
      throw new Error('Unexpected API response format');
    }

    const content = result.choices[0].message.content;
    console.log('Content from API:', content);

    let landingPageContent;
    try {
      // Try to parse the content directly
      landingPageContent = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse content directly:', error);
      // If direct parsing fails, try to extract JSON
      const extracted = extractJsonFromString(content);
      landingPageContent = JSON.parse(extracted);
    }

    // Validate the structure
    if (!landingPageContent.hero || !landingPageContent.value_proposition) {
      console.error('Invalid content structure:', landingPageContent);
      throw new Error('Generated content is missing required sections');
    }

    return new Response(
      JSON.stringify(landingPageContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('Edge function error:', error);
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
