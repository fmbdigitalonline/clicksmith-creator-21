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

    // Enhanced prompt for more professional and complete content
    const prompt = `Generate a professional and complete landing page content. Return ONLY a valid JSON object (no markdown, no code blocks) with the following structure:

{
  "hero": {
    "title": "Write a powerful headline (8-12 words) that immediately grabs attention by addressing the main value proposition or solving a critical pain point. Make it action-oriented and benefit-focused.",
    "description": "Write a compelling 2-3 sentence description (40-60 words) that elaborates on the value proposition, addresses key pain points, and creates desire through concrete benefits. Use emotionally resonant language.",
    "cta": "Write a strong call-to-action button text (3-5 words) that creates urgency"
  },
  "features": [
    "Write 3 detailed feature descriptions (15-20 words each) that highlight the unique capabilities and technological advantages of the solution"
  ],
  "benefits": [
    "Write 3 compelling benefit statements (15-20 words each) that focus on transformation and positive outcomes for the user"
  ],
  "painPoints": [
    "Write 2 specific pain point solutions (20-25 words each) that demonstrate deep understanding of user challenges and how your solution addresses them"
  ],
  "socialProof": {
    "testimonials": [
      {
        "content": "Write a detailed, results-focused testimonial (30-40 words) that highlights specific improvements or outcomes",
        "name": "Create a realistic customer name",
        "role": "Add a relevant professional title and company type"
      }
    ]
  },
  "callToAction": {
    "title": "Write an urgent, benefit-focused headline (8-10 words) that motivates immediate action",
    "description": "Write a compelling final pitch (25-35 words) that summarizes the key value proposition and creates FOMO",
    "buttonText": "Write action-oriented button text (3-5 words)"
  }
}

Use this business information to create professional, conversion-focused content:

Business Details:
- Value Proposition: ${businessIdea?.valueProposition || 'Not specified'}
- Description: ${businessIdea?.description || 'Not specified'}

Target Audience Insights:
- Audience Description: ${targetAudience?.description || 'Not specified'}
- Demographics: ${targetAudience?.demographics || 'Not specified'}
- Pain Points: ${JSON.stringify(targetAudience?.painPoints || [])}
- Core Message: ${targetAudience?.coreMessage || 'Not specified'}

Market Analysis:
- Market Desire: ${audienceAnalysis?.marketDesire || 'Not specified'}
- Awareness Level: ${audienceAnalysis?.awarenessLevel || 'Not specified'}
- Deep Pain Points: ${JSON.stringify(audienceAnalysis?.deepPainPoints || [])}

Content Guidelines:
1. Use clear, professional language that resonates with the target audience
2. Focus on concrete benefits and measurable outcomes
3. Include specific numbers, statistics, or metrics where relevant
4. Use action-oriented and emotionally engaging language
5. Maintain a confident, authoritative tone
6. Address specific pain points and their solutions
7. End each section with a clear value proposition
8. Use industry-relevant terminology without jargon
9. Incorporate social proof and credibility markers
10. Ensure all content aligns with the business's core value proposition

IMPORTANT: Return ONLY the JSON object, with no additional formatting, markdown, or code blocks.`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('DEEPSEEK_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert landing page copywriter. You must return ONLY valid JSON without any markdown formatting or code blocks.',
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

    let landingPageContent = data.choices[0].message.content;
    console.log('Raw landing page content:', landingPageContent);

    // Clean the response by removing any markdown or code block syntax
    landingPageContent = landingPageContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    console.log('Cleaned landing page content:', landingPageContent);

    // Parse and validate the response
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
