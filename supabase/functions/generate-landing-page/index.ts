
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessIdea, targetAudience, audienceAnalysis } = await req.json();

    console.log('Received project data:', {
      businessIdea: JSON.stringify(businessIdea, null, 2),
      targetAudience: JSON.stringify(targetAudience, null, 2),
      audienceAnalysis: JSON.stringify(audienceAnalysis, null, 2)
    });

    // Create a comprehensive prompt for the landing page
    const prompt = `Generate a landing page content in JSON format with the following structure:
{
  "hero": {
    "title": "Main attention-grabbing headline",
    "description": "Compelling subheadline",
    "cta": "Call to action button text"
  },
  "features": ["Feature 1", "Feature 2", "Feature 3"],
  "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "painPoints": ["Pain point and solution 1", "Pain point and solution 2"],
  "socialProof": {
    "testimonials": [
      {
        "content": "Testimonial text",
        "name": "Customer name",
        "role": "Customer role/position"
      }
    ]
  },
  "callToAction": {
    "title": "Final call to action heading",
    "description": "Compelling reason to act now",
    "buttonText": "Action button text"
  }
}

Use this business information to create compelling content:

Business Value Proposition: ${businessIdea?.valueProposition || 'Not specified'}
Business Description: ${businessIdea?.description || 'Not specified'}

Target Audience:
- Description: ${targetAudience?.description || 'Not specified'}
- Demographics: ${targetAudience?.demographics || 'Not specified'}
- Pain Points: ${JSON.stringify(targetAudience?.painPoints || [])}
- Core Message: ${targetAudience?.coreMessage || 'Not specified'}

Market Analysis:
- Market Desire: ${audienceAnalysis?.marketDesire || 'Not specified'}
- Awareness Level: ${audienceAnalysis?.awarenessLevel || 'Not specified'}
- Deep Pain Points: ${JSON.stringify(audienceAnalysis?.deepPainPoints || [])}

Important: Return ONLY valid JSON that matches the structure above exactly.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a landing page expert. Always return valid JSON matching the exact structure provided, with no additional formatting or text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data, null, 2));
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    const landingPageContent = data.choices[0].message.content;
    console.log('Raw landing page content:', landingPageContent);

    // Parse the response and ensure it has the required structure
    try {
      const parsedContent = JSON.parse(landingPageContent);
      console.log('Parsed content:', JSON.stringify(parsedContent, null, 2));

      // Validate the structure
      if (!parsedContent.hero || !parsedContent.features || !parsedContent.benefits) {
        throw new Error('Missing required sections in the response');
      }

      const structuredContent = {
        hero: {
          title: parsedContent.hero?.title || "Transform Your Business Today",
          description: parsedContent.hero?.description || "Take your business to the next level with our innovative solution",
          cta: parsedContent.hero?.cta || "Get Started Now",
        },
        features: Array.isArray(parsedContent.features) ? parsedContent.features : [],
        benefits: Array.isArray(parsedContent.benefits) ? parsedContent.benefits : [],
        painPoints: Array.isArray(parsedContent.painPoints) ? parsedContent.painPoints : [],
        socialProof: {
          testimonials: Array.isArray(parsedContent.socialProof?.testimonials) 
            ? parsedContent.socialProof.testimonials 
            : [],
        },
        callToAction: {
          title: parsedContent.callToAction?.title || "Ready to Transform Your Business?",
          description: parsedContent.callToAction?.description || "Join thousands of satisfied customers and start your journey today.",
          buttonText: parsedContent.callToAction?.buttonText || "Get Started",
        },
      };

      console.log('Final structured content:', JSON.stringify(structuredContent, null, 2));

      return new Response(JSON.stringify(structuredContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing landing page content:', parseError);
      console.error('Failed content:', landingPageContent);
      throw new Error(`Failed to parse landing page content: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in generate-landing-page function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate landing page content',
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
