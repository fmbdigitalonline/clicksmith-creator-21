
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface ProjectInput {
  projectId: string
  businessIdea: {
    description: string
    valueProposition: string
  }
  targetAudience: {
    demographics: string
    painPoints: string[]
    preferences: string[]
  }
  userId: string
}

async function generateHeroSection(input: ProjectInput) {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert in creating compelling landing page content."
          },
          {
            role: "user",
            content: `Create a hero section for a landing page about: ${input.businessIdea.description}. 
            Target audience: ${JSON.stringify(input.targetAudience)}
            Value proposition: ${input.businessIdea.valueProposition}
            
            Return a JSON object with:
            - headline (compelling main headline)
            - subheadline (supporting text)
            - ctaText (call to action button text)
            - imagePrompt (detailed prompt for image generation)`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Error generating hero section:', error);
    throw error;
  }
}

async function generateSections(input: ProjectInput) {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert in creating compelling landing page content."
          },
          {
            role: "user",
            content: `Create content sections for a landing page about: ${input.businessIdea.description}. 
            Target audience: ${JSON.stringify(input.targetAudience)}
            Value proposition: ${input.businessIdea.valueProposition}
            
            Return a JSON object with these sections:
            - features (array of features with title and description)
            - benefits (array of benefits with title and description)
            - howItWorks (array of steps with title and description)
            - testimonials (array of testimonial objects with quote, author, and role)
            - faq (array of FAQ objects with question and answer)
            - pricing (array of pricing tiers with name, price, and features array)
            Each section should be detailed and compelling.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Error generating sections:', error);
    throw error;
  }
}

async function generateTheme(input: ProjectInput) {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert in web design and branding."
          },
          {
            role: "user",
            content: `Create a theme for a landing page about: ${input.businessIdea.description}. 
            Target audience: ${JSON.stringify(input.targetAudience)}
            
            Return a JSON object with:
            - colors (object with primary, secondary, accent, text, background colors)
            - typography (object with headingFont, bodyFont, fontSize scale)
            - spacing (object with section padding, component gaps)
            - borderRadius
            - boxShadow`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Error generating theme:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const input: ProjectInput = await req.json()
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Create generation log
    const { data: log, error: logError } = await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: input.projectId,
        status: 'generating_content',
        step_details: { stage: 'started' }
      })
      .select()
      .single()

    if (logError) throw logError

    // Generate content
    const [hero, sections, theme] = await Promise.all([
      generateHeroSection(input),
      generateSections(input),
      generateTheme(input)
    ])

    // Update generation log
    await supabase
      .from('landing_page_generation_logs')
      .update({
        status: 'completed',
        success: true,
        step_details: { stage: 'completed', timestamp: new Date().toISOString() }
      })
      .eq('id', log.id)

    // Create or update landing page
    const { data: existingPage } = await supabase
      .from('landing_pages')
      .select()
      .eq('project_id', input.projectId)
      .single()

    const landingPageData = {
      project_id: input.projectId,
      user_id: input.userId,
      content: {
        hero,
        ...sections
      },
      theme_settings: theme,
      generation_version: existingPage ? existingPage.generation_version + 1 : 1,
      last_generated_at: new Date().toISOString()
    }

    const { data: landingPage, error: saveError } = await supabase
      .from('landing_pages')
      .upsert(landingPageData)
      .select()
      .single()

    if (saveError) throw saveError

    return new Response(
      JSON.stringify(landingPage),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
