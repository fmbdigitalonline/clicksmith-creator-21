
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

const cleanJsonString = (str: string) => {
  // Remove markdown code block syntax
  str = str.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  // Remove any leading/trailing whitespace
  str = str.trim();
  return str;
};

const generateDetailedPrompt = (businessIdea: any, targetAudience: any) => {
  return `Generate a complete JSON structure for a landing page with these requirements:

Business Context:
${JSON.stringify({ businessIdea, targetAudience }, null, 2)}

Generate a JSON response with this exact structure (no markdown, pure JSON):
{
  "hero": {
    "title": "A compelling headline that captures the value proposition",
    "description": "A clear, engaging subtitle that expands on the main benefit",
    "cta": "Action-oriented button text",
    "image": "Description of ideal hero image"
  },
  "value_proposition": {
    "title": "Why Choose [Business]",
    "description": "Overview of key benefits",
    "cards": [
      {
        "title": "Key Benefit 1",
        "description": "Detailed explanation",
        "icon": "✨"
      }
    ]
  },
  "features": {
    "title": "Our Features",
    "description": "What makes us unique",
    "items": [
      {
        "title": "Feature 1",
        "description": "Detailed feature description",
        "icon": "🎯"
      }
    ]
  },
  "proof": {
    "title": "What Our Clients Say",
    "description": "Real results from real clients",
    "items": [
      {
        "quote": "A testimonial that addresses key pain points",
        "author": "Client Name",
        "role": "Position",
        "company": "Company Name"
      }
    ]
  },
  "pricing": {
    "title": "Simple, Transparent Pricing",
    "description": "Choose the plan that works for you",
    "items": [
      {
        "name": "Plan Name",
        "price": "Price",
        "description": "Plan description",
        "features": ["Feature 1", "Feature 2"]
      }
    ]
  },
  "finalCta": {
    "title": "Ready to Get Started?",
    "description": "Take the next step",
    "cta": "Get Started Now"
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
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    if (!DEEPSEEK_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing API configuration' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    console.log('Generating content with prompt...');
    const prompt = generateDetailedPrompt(businessIdea, targetAudience);

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
            content: "You are a landing page content creator. Generate ONLY valid JSON content with NO markdown formatting."
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
      console.error('DeepSeek API error:', await response.text());
      throw new Error(`DeepSeek API returned ${response.status}`);
    }

    const result = await response.json();
    console.log('DeepSeek API response:', JSON.stringify(result, null, 2));

    if (!result.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    const content = result.choices[0].message.content;
    const cleanedContent = cleanJsonString(content);
    
    console.log('Cleaned content:', cleanedContent);
    
    // Validate the JSON structure
    const parsedContent = JSON.parse(cleanedContent);
    
    if (!parsedContent.hero || !parsedContent.value_proposition) {
      throw new Error('Generated content missing required sections');
    }

    return new Response(
      JSON.stringify(parsedContent),
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
