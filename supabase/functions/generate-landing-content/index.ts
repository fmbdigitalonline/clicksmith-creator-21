
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface ProjectData {
  business_idea: any;
  target_audience: any;
  audience_analysis: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectData, landingPageId } = await req.json() as { projectData: ProjectData; landingPageId: string };
    
    // Update generation status to 'generating'
    const client = await createClient();
    await client.from('landing_pages')
      .update({ generation_status: 'generating' })
      .eq('id', landingPageId);

    // Generate content sections
    const sections = await generateSections(projectData);
    
    // Update landing page with generated content
    await client.from('landing_pages')
      .update({
        content: { sections },
        generation_status: 'completed',
        content_version: client.sql`content_version + 1`,
        last_generated_from: projectData,
        updated_at: new Date().toISOString()
      })
      .eq('id', landingPageId);

    return new Response(
      JSON.stringify({ success: true, sections }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    
    // Update generation status to 'failed' if there was an error
    if (error.landingPageId) {
      const client = await createClient();
      await client.from('landing_pages')
        .update({ 
          generation_status: 'failed',
          generation_metadata: { error: error.message }
        })
        .eq('id', error.landingPageId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateSections(projectData: ProjectData) {
  const { business_idea, target_audience, audience_analysis } = projectData;

  const sections = [];

  // Generate Hero Section
  const heroSection = await generateWithGPT({
    type: 'hero',
    businessIdea: business_idea,
    targetAudience: target_audience,
    prompt: `Create a compelling hero section for a landing page about ${business_idea.description}. 
    Target audience: ${target_audience.description}.
    Core message: ${target_audience.coreMessage}.
    Value proposition: ${business_idea.valueProposition}.`
  });

  sections.push({
    type: 'hero',
    order: 1,
    content: heroSection
  });

  // Generate Features Section
  const featuresSection = await generateWithGPT({
    type: 'features',
    painPoints: audience_analysis.deepPainPoints,
    solutions: business_idea.solutions,
    sophisticationLevel: audience_analysis.sophisticationLevel,
    prompt: `Create a features section highlighting solutions to these pain points: ${JSON.stringify(audience_analysis.deepPainPoints)}.
    Solutions offered: ${JSON.stringify(business_idea.solutions)}.
    Audience sophistication: ${audience_analysis.sophisticationLevel}.`
  });

  sections.push({
    type: 'features',
    order: 2,
    content: featuresSection
  });

  // Generate Social Proof Section
  const socialProofSection = await generateWithGPT({
    type: 'social-proof',
    targetAudience: target_audience,
    marketingAngle: target_audience.marketingAngle,
    prompt: `Create social proof content for ${business_idea.description}.
    Target demographic: ${target_audience.demographics}.
    Marketing angle: ${target_audience.marketingAngle}.`
  });

  sections.push({
    type: 'social-proof',
    order: 3,
    content: socialProofSection
  });

  return sections;
}

async function generateWithGPT({ prompt, ...context }) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a landing page content generator. Generate content based on the business and audience context provided.'
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
  return JSON.parse(data.choices[0].message.content);
}

async function createClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );
}
