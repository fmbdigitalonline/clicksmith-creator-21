
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

    const prompt = `Write a compelling landing page content for ${businessIdea?.valueProposition || 'this business'}. 

Target Audience: ${targetAudience?.icp || 'General audience'}
Key Pain Points: ${Array.isArray(targetAudience?.painPoints) ? targetAudience.painPoints.join(', ') : 'Not specified'}
Benefits: ${Array.isArray(audienceAnalysis?.benefits) ? audienceAnalysis.benefits.join(', ') : 'Not specified'}

Follow the AIDA formula (Attention, Interest, Desire, Action) and structure the content as follows:

1. Attention (Headline - 8-12 words):
- Grab attention by addressing key pain point or desire
- Use emotional hooks (fear of failure, success excitement, curiosity)
- Highlight primary benefit
Example: "The Ultimate Tool to Validate Your Business Idea in Minutes"

2. Interest (Subtitle):
- First sentence (8-12 words): Explain relevance and versatility
- Second sentence (8-12 words): Create desire through unique features
- Final part (4-6 words): Subtle call-to-action
Example: "Our AI generates your Ideal Customer Profile and high-converting ads—so you can test what works before launching. Try it free today."

3. Features Section (List 4-5 key features):
- Focus on problem-solving capabilities
- Highlight technical advantages
- Emphasize ease of use
- Include automation and time-saving aspects

4. Benefits Section (List 4-5 key benefits):
- Focus on outcomes and results
- Include measurable improvements
- Highlight competitive advantages
- Emphasize value proposition

5. Pain Points Section (Address 3-4 main challenges):
- Identify common industry problems
- Explain how your solution addresses each
- Include relevant statistics or examples
- Show understanding of user frustrations

6. Social Proof Section:
- Include 2-3 testimonial placeholders
- Focus on transformation stories
- Highlight specific results
- Include industry relevance

7. Call to Action Section:
- Compelling headline
- Value proposition summary
- Urgency creation
- Clear action button text

Tone & Style:
- Professional but approachable
- Confident and solution-focused
- Clear and jargon-free
- Empathetic to user challenges

Please provide structured, detailed content for each section that can be easily parsed into a modern, visually appealing landing page.`;

    console.log('Sending prompt to OpenAI:', prompt);

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
            content: 'You are an expert copywriter specializing in creating compelling landing pages that convert. Always structure your response clearly with section headers and use "-" for list items.'
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
  const sections = content.split('\n\n');
  
  // Helper function to extract list items
  const extractListItems = (section: string) => 
    section?.split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace('-', '').trim()) || [];

  // Find section by keyword
  const findSection = (keyword: string) => 
    sections.find(s => s.toLowerCase().includes(keyword.toLowerCase()));

  // Extract headline and subtitle
  const headlineSection = findSection('Attention') || findSection('Headline');
  const headline = headlineSection?.split('\n')[0]?.replace('Headline:', '').trim();
  
  const subtitleSection = findSection('Interest') || findSection('Subtitle');
  const subtitle = subtitleSection?.split('\n').slice(1).join(' ').trim();

  return {
    hero: {
      title: headline || 'Transform Your Business Idea into Reality',
      description: subtitle || 'Start validating your business idea today',
      cta: 'Get Started Now',
    },
    features: extractListItems(findSection('Features') || ''),
    benefits: extractListItems(findSection('Benefits') || ''),
    painPoints: extractListItems(findSection('Pain Points') || ''),
    socialProof: {
      testimonials: extractListItems(findSection('Social Proof') || '')
        .map(testimonial => ({
          content: testimonial,
          name: 'Satisfied Customer',
          role: 'Business Owner'
        }))
    },
    callToAction: {
      title: 'Ready to Transform Your Business Idea?',
      description: findSection('Call to Action')?.split('\n').slice(1).join(' ').trim() || 
                  'Join thousands of entrepreneurs who have successfully validated their business ideas',
      buttonText: 'Start Now',
    },
  };
}
