
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateWithDeepeek(prompt: string, context: any) {
  const DEEPEEK_API_KEY = Deno.env.get('DEEPEEK_API_KEY');
  if (!DEEPEEK_API_KEY) {
    throw new Error('DEEPEEK_API_KEY is not set');
  }

  try {
    console.log('🤖 Calling Deepeek API with prompt:', prompt);
    const response = await fetch('https://api.deepeek.com/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        context,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Deepeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🤖 Deepeek response:', data);
    return data.choices[0].text;
  } catch (error) {
    console.error('❌ Deepeek API error:', error);
    throw error;
  }
}

async function generateIterativeContent(businessIdea: any, targetAudience: any) {
  console.log('📝 Starting iterative content generation...');
  
  try {
    // Step 1: Generate core messaging
    const heroContent = await generateWithDeepeek(
      `Create a compelling hero section for a landing page about: ${businessIdea.description}. 
       Target audience: ${targetAudience.demographics}.
       Include a headline, subheadline, and call to action.`,
      { type: 'hero', businessIdea, targetAudience }
    );

    // Step 2: Generate value propositions
    const valueProps = await generateWithDeepeek(
      `List 3 key value propositions for: ${businessIdea.description}.
       Make them specific to ${targetAudience.demographics}.
       Include a title and description for each.`,
      { type: 'features', previousContent: heroContent }
    );

    // Step 3: Generate features with examples
    const features = await generateWithDeepeek(
      `Describe 3 main features of the solution: ${businessIdea.description}.
       Include specific benefits for ${targetAudience.demographics}.
       Add real-world examples or use cases.`,
      { type: 'features', previousContent: valueProps }
    );

    // Step 4: Generate social proof
    const testimonials = await generateWithDeepeek(
      `Create 2 testimonials from ${targetAudience.demographics} about: ${businessIdea.description}.
       Include specific results and benefits they experienced.`,
      { type: 'testimonials', previousContent: features }
    );

    // Step 5: Generate FAQ content
    const faq = await generateWithDeepeek(
      `Create 4 frequently asked questions about: ${businessIdea.description}.
       Address common concerns of ${targetAudience.demographics}.
       Provide detailed, reassuring answers.`,
      { type: 'faq', previousContent: testimonials }
    );

    return {
      hero: JSON.parse(heroContent),
      value_proposition: JSON.parse(valueProps),
      features: JSON.parse(features),
      proof: JSON.parse(testimonials),
      faq: JSON.parse(faq)
    };
  } catch (error) {
    console.error('❌ Error in iterative content generation:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, businessIdea, targetAudience, userId } = await req.json();
    console.log('📝 Starting landing page generation for project:', projectId);

    if (!projectId || !userId) {
      throw new Error('Missing required parameters: projectId and userId');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Generate content iteratively
    console.log('🔄 Starting iterative content generation...');
    const generatedContent = await generateIterativeContent(businessIdea, targetAudience);

    // Create the full landing page content structure
    const landingPageContent = {
      ...generatedContent,
      pricing: {
        title: "Simple, Transparent Pricing",
        description: "Choose the plan that's right for you",
        items: [
          {
            name: "Starter",
            price: "$49/mo",
            features: ["Core features", "Basic support", "Up to 1000 users"]
          },
          {
            name: "Professional",
            price: "$99/mo",
            features: ["All Starter features", "Priority support", "Advanced analytics"]
          }
        ]
      },
      finalCta: {
        title: "Ready to Get Started?",
        description: "Join thousands of satisfied customers and transform your business today.",
        ctaText: "Start Now"
      },
      footer: {
        content: {
          links: {
            company: ["About", "Contact", "Careers"],
            resources: ["Help Center", "Terms", "Privacy"]
          }
        }
      }
    };

    console.log('📝 Generated content structure:', landingPageContent);

    // Create a unique slug
    const slug = `landing-page-${Math.random().toString(36).substring(2, 8)}`;

    // Insert the landing page
    const { data: landingPage, error: insertError } = await supabaseAdmin
      .from('landing_pages')
      .insert({
        project_id: projectId,
        user_id: userId,
        title: businessIdea?.title || "Untitled Landing Page",
        content: landingPageContent,
        slug,
        published: false,
        content_iterations: 1,
        theme_settings: {
          colorScheme: "light",
          typography: {
            headingFont: "Inter",
            bodyFont: "Inter"
          },
          spacing: {
            sectionPadding: "py-16",
            componentGap: "gap-8"
          }
        }
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Error inserting landing page:', insertError);
      throw insertError;
    }

    console.log('✅ Landing page created successfully:', landingPage);

    return new Response(
      JSON.stringify(landingPage),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in generate-landing-page function:', error);
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
