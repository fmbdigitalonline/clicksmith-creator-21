
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

    const prompt = `Write a compelling headline and subtitle combination for a landing page that promotes ${businessIdea.valueProposition}. 

Target Audience: ${targetAudience.icp}

Key Pain Points: ${targetAudience.painPoints.join(', ')}

Benefits: ${audienceAnalysis.benefits.join(', ')}

The content should follow the AIDA formula (Attention, Interest, Desire, Action) and adhere to the following structure:

1. Headline (8-12 words): Address key pain points and highlight primary benefit
2. Features section: List 3-4 key features that solve user problems
3. Benefits section: List 3-4 key benefits of using the solution
4. Pain Points section: Address 2-3 main challenges the solution solves
5. Call to Action: Compelling reason to act now

Use a professional but approachable tone. Focus on clear value proposition and problem-solving.`;

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
            content: 'You are an expert copywriter specializing in creating compelling landing pages that convert.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const landingPageContent = data.choices[0].message.content;

    // Parse the response into structured content
    const contentSections = parseLandingPageContent(landingPageContent);

    return new Response(JSON.stringify(contentSections), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating landing page content:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseLandingPageContent(content: string) {
  // Simple parsing logic - in reality, you might want to make this more robust
  const sections = content.split('\n\n');
  
  return {
    hero: {
      title: sections[0]?.replace('Headline: ', '').trim() || 'Transform Your Business Idea into Reality',
      description: sections[1]?.trim() || 'Start validating your business idea today',
      cta: 'Get Started Now',
    },
    features: sections
      .find(s => s.toLowerCase().includes('feature'))
      ?.split('\n')
      .filter(line => line.startsWith('-'))
      .map(line => line.replace('-', '').trim()) || [],
    benefits: sections
      .find(s => s.toLowerCase().includes('benefit'))
      ?.split('\n')
      .filter(line => line.startsWith('-'))
      .map(line => line.replace('-', '').trim()) || [],
    painPoints: sections
      .find(s => s.toLowerCase().includes('pain point'))
      ?.split('\n')
      .filter(line => line.startsWith('-'))
      .map(line => line.replace('-', '').trim()) || [],
    testimonials: [],
    callToAction: {
      title: 'Ready to Transform Your Business Idea?',
      description: sections.find(s => s.toLowerCase().includes('call to action'))?.split('\n')[1]?.trim() || 
                  'Join thousands of entrepreneurs who have successfully validated their business ideas',
      buttonText: 'Start Now',
    },
  };
}
