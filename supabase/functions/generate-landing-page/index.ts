
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

    console.log('Received data:', { businessIdea, targetAudience, audienceAnalysis });

    // Create a comprehensive prompt for the landing page
    const prompt = `Create a professional and compelling landing page content for a business with the following details:

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

Generate a structured landing page content that includes:
1. Hero section with compelling headline, description, and call-to-action
2. 3-4 key features that solve main pain points
3. 4-5 clear benefits that address market desires
4. 2-3 pain points with solutions
5. 2-3 testimonials that showcase transformation
6. Strong call-to-action section

Return the content in a structured JSON format suitable for a modern, professional landing page.`;

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
            content: 'You are an expert copywriter and landing page specialist. Create compelling, conversion-focused content that follows modern landing page best practices. Always return properly structured JSON.',
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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const landingPageContent = data.choices[0].message.content;

    // Parse the response and ensure it has the required structure
    try {
      const parsedContent = JSON.parse(landingPageContent);
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

      return new Response(JSON.stringify(structuredContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse landing page content');
    }
  } catch (error) {
    console.error('Error in generate-landing-page function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate landing page content' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
