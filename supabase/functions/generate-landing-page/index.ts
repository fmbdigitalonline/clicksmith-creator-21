
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { DeepeekClient } from './deepeek.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerationRequest {
  projectId: string;
  businessIdea: any;
  targetAudience: any;
  userId: string;
  iterationNumber?: number;
  currentContent?: any;
  isRefinement?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting landing page generation...');
    const { 
      projectId, 
      businessIdea, 
      targetAudience, 
      userId, 
      iterationNumber = 1,
      currentContent = null,
      isRefinement = false 
    } = await req.json();

    if (!projectId || !businessIdea || !userId) {
      throw new Error('Missing required parameters');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const deepeekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

    if (!supabaseUrl || !supabaseKey || !deepeekApiKey) {
      throw new Error('Missing configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const deepeek = new DeepeekClient(deepeekApiKey);

    // Get project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('title, business_idea, target_audience, audience_analysis')
      .eq('id', projectId)
      .single();

    if (projectError) {
      throw projectError;
    }

    // Generate or refine content based on mode
    const content = isRefinement && currentContent ? 
      await refineContent(currentContent, project, iterationNumber, deepeek) :
      await generateInitialContent(project, businessIdea, targetAudience, deepeek);

    // Generate a unique slug
    const baseSlug = (project.title || "untitled")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomSuffix}`;

    // Log generation attempt
    await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        success: true,
        generation_time: Date.now(),
        request_payload: { businessIdea, targetAudience, iterationNumber, isRefinement },
        response_payload: { content },
        step_details: {
          stage: 'content_generated',
          timestamp: new Date().toISOString()
        }
      });

    if (isRefinement) {
      // Update existing landing page
      const { error: updateError } = await supabase
        .from('landing_pages')
        .update({
          content,
          content_iterations: iterationNumber,
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId);

      if (updateError) throw updateError;

    } else {
      // Create new landing page
      const { error: createError } = await supabase
        .from('landing_pages')
        .insert({
          project_id: projectId,
          user_id: userId,
          title: project.title || "Untitled Landing Page",
          content,
          slug,
          theme_settings: generateThemeSettings(),
          content_iterations: 1
        });

      if (createError) throw createError;
    }

    return new Response(
      JSON.stringify({
        content,
        theme_settings: generateThemeSettings(),
        statistics: generateInitialStatistics()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-landing-page function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function generateThemeSettings() {
  return {
    colorScheme: "light",
    typography: {
      headingFont: "Inter",
      bodyFont: "Inter"
    },
    spacing: {
      sectionPadding: "py-16",
      componentGap: "gap-8"
    }
  };
}

function generateInitialStatistics() {
  return {
    metrics: [],
    data_points: []
  };
}

async function generateInitialContent(project: any, businessIdea: any, targetAudience: any, deepeek: any) {
  // First iteration: Core content
  const heroContent = await deepeek.generate({
    prompt: `Generate a compelling hero section for a landing page about ${businessIdea.description}. 
    Target audience: ${targetAudience.demographics}. 
    Include a headline, subheadline, and call-to-action button text.`,
    max_tokens: 500
  });

  // Second iteration: Features and Benefits
  const featuresContent = await deepeek.generate({
    prompt: `Generate 3-5 key features and benefits for ${businessIdea.description}, 
    specifically addressing the pain points of ${targetAudience.demographics}.`,
    max_tokens: 800
  });

  // Third iteration: Social Proof
  const testimonialsContent = await deepeek.generate({
    prompt: `Generate 2 realistic testimonials from ${targetAudience.demographics} 
    about how ${businessIdea.description} helped them. Include their role and specific benefits they experienced.`,
    max_tokens: 600
  });

  return {
    hero: {
      title: heroContent.choices[0]?.message?.content?.title || businessIdea.valueProposition || project.title || "Welcome",
      description: heroContent.choices[0]?.message?.content?.description || businessIdea.description || "",
      cta: heroContent.choices[0]?.message?.content?.cta || "Get Started Now",
    },
    features: featuresContent.choices[0]?.message?.content?.features || [],
    benefits: featuresContent.choices[0]?.message?.content?.benefits || [],
    testimonials: testimonialsContent.choices[0]?.message?.content?.testimonials || generateTestimonials(targetAudience),
    callToAction: {
      title: "Ready to Get Started?",
      description: "Join thousands of satisfied customers and transform your business today.",
      buttonText: "Start Now",
    }
  };
}

async function refineContent(currentContent: any, project: any, iterationNumber: number, deepeek: any) {
  // Enhance existing content while maintaining structure
  const refinedContent = { ...currentContent };
  
  // Enhance hero section
  if (refinedContent.hero) {
    const enhancedHero = await deepeek.generate({
      prompt: `Enhance this hero section while maintaining its core message: ${JSON.stringify(refinedContent.hero)}`,
      max_tokens: 500
    });
    refinedContent.hero = {
      ...refinedContent.hero,
      description: enhancedHero.choices[0]?.message?.content?.description || refinedContent.hero.description
    };
  }

  // Enhance features
  if (refinedContent.features?.length > 0) {
    const enhancedFeatures = await deepeek.generate({
      prompt: `Enhance these features with more specific details: ${JSON.stringify(refinedContent.features)}`,
      max_tokens: 800
    });
    refinedContent.features = enhancedFeatures.choices[0]?.message?.content?.features || refinedContent.features;
  }

  return refinedContent;
}

function generateTestimonials(targetAudience: any) {
  return [{
    name: "John Smith",
    role: targetAudience.demographics || "Professional",
    content: "This solution transformed how we work. Highly recommended!"
  }];
}
