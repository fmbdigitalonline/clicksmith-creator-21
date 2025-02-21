
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface ProjectData {
  business_idea: {
    description: string;
    valueProposition: string;
  };
  target_audience: {
    name: string;
    description: string;
    icp: string;
    painPoints: string[];
    coreMessage: string;
  };
  audience_analysis: {
    expandedDefinition: string;
    marketDesire: string;
    awarenessLevel: string;
    deepPainPoints: string[];
    potentialObjections: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectData, landingPageId } = await req.json() as { projectData: ProjectData; landingPageId: string };
    
    console.log("Received project data:", JSON.stringify(projectData, null, 2));
    
    // Update generation status to 'generating'
    const client = await createClient();
    await client.from('landing_pages')
      .update({ 
        generation_status: 'generating',
        generation_metadata: {
          status: 'Starting generation...',
          progress: 0
        }
      })
      .eq('id', landingPageId);

    // Generate content sections
    const sections = await generateSections(projectData);
    
    console.log("Generated sections:", JSON.stringify(sections, null, 2));
    
    // Update landing page with generated content
    await client.from('landing_pages')
      .update({
        content: { sections },
        generation_status: 'completed',
        generation_metadata: {
          status: 'Completed successfully',
          progress: 100
        },
        content_version: client.sql`content_version + 1`,
        updated_at: new Date().toISOString()
      })
      .eq('id', landingPageId);

    return new Response(
      JSON.stringify({ success: true, sections }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    
    // Update generation status to 'failed' with error details
    if (error.landingPageId) {
      const client = await createClient();
      await client.from('landing_pages')
        .update({ 
          generation_status: 'failed',
          generation_metadata: { 
            error: error.message,
            status: 'Generation failed',
            progress: 0
          }
        })
        .eq('id', error.landingPageId);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
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
    prompt: `Create a compelling hero section for a landing page about ${business_idea.description}.
    Target audience: ${target_audience.description}
    Core message: ${target_audience.coreMessage}
    Value proposition: ${business_idea.valueProposition}
    Market desire: ${audience_analysis.marketDesire}
    
    Create a JSON response with:
    {
      "title": "A compelling headline that grabs attention",
      "subtitle": "A supporting statement that explains the value",
      "primaryCta": {
        "text": "Call to action button text",
        "description": "Small text under the button"
      }
    }`
  });

  sections.push({
    type: 'hero',
    order: 1,
    content: heroSection
  });

  // Generate Features Section
  const featuresSection = await generateWithGPT({
    type: 'features',
    prompt: `Create a features section for ${business_idea.description}.
    Pain points to address: ${JSON.stringify(audience_analysis.deepPainPoints)}
    Target audience: ${target_audience.icp}
    Awareness level: ${audience_analysis.awarenessLevel}
    
    Create a JSON response with:
    {
      "title": "Section headline about features and benefits",
      "subtitle": "Supporting text explaining the value",
      "items": [
        {
          "title": "Feature 1 title",
          "description": "Feature 1 description"
        },
        {
          "title": "Feature 2 title",
          "description": "Feature 2 description"
        },
        {
          "title": "Feature 3 title",
          "description": "Feature 3 description"
        }
      ]
    }`
  });

  sections.push({
    type: 'features',
    order: 2,
    content: featuresSection
  });

  // Generate Social Proof Section
  const socialProofSection = await generateWithGPT({
    type: 'social-proof',
    prompt: `Create social proof content for ${business_idea.description}.
    Target audience: ${target_audience.description}
    Pain points: ${JSON.stringify(target_audience.painPoints)}
    Market desire: ${audience_analysis.marketDesire}
    
    Create a JSON response with:
    {
      "title": "Social proof section headline",
      "subtitle": "Supporting text about customer success",
      "testimonials": [
        {
          "quote": "A testimonial quote",
          "author": "Customer name",
          "title": "Customer description"
        },
        {
          "quote": "Another testimonial quote",
          "author": "Customer name",
          "title": "Customer description"
        }
      ]
    }`
  });

  sections.push({
    type: 'social-proof',
    order: 3,
    content: socialProofSection
  });

  return sections;
}

async function generateWithGPT({ prompt }: { prompt: string }) {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key is not set');
  }

  try {
    console.log("Sending prompt to OpenAI:", prompt);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a landing page content generator. Generate JSON content based on the business and audience context provided. Always return valid JSON that matches the requested structure.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log("OpenAI response:", data);

    try {
      const content = JSON.parse(data.choices[0].message.content);
      return content;
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      throw new Error('Failed to parse generated content');
    }
  } catch (error) {
    console.error("Error in generateWithGPT:", error);
    throw error;
  }
}

async function createClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );
}
