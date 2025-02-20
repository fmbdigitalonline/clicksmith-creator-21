
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
      await refineContent(currentContent, project, iterationNumber) :
      await generateInitialContent(project, businessIdea, targetAudience);

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

async function generateInitialContent(project: any, businessIdea: any, targetAudience: any) {
  return {
    hero: {
      title: businessIdea.valueProposition || project.title || "Untitled Landing Page",
      description: businessIdea.description || "Experience innovation and excellence",
      cta: "Get Started Today",
      image: "/placeholder.svg"
    },
    features: {
      title: "Why Choose Us",
      cards: generateFeatureCards(project)
    },
    benefits: {
      title: "Our Features",
      items: generateBenefitItems(project)
    },
    testimonials: targetAudience ? {
      title: "What Our Clients Say",
      items: generateTestimonials(targetAudience)
    } : null,
    callToAction: {
      title: "Ready to Get Started?",
      description: "Join thousands of satisfied customers and transform your business today.",
      buttonText: "Start Now"
    }
  };
}

async function refineContent(currentContent: any, project: any, iterationNumber: number) {
  // Enhance existing content while maintaining structure
  const refinedContent = { ...currentContent };
  
  // Enhance hero section
  if (refinedContent.hero) {
    refinedContent.hero = {
      ...refinedContent.hero,
      description: await enhanceDescription(refinedContent.hero.description, iterationNumber)
    };
  }

  // Enhance features
  if (refinedContent.features?.cards) {
    refinedContent.features.cards = await Promise.all(
      refinedContent.features.cards.map(async (card: any) => ({
        ...card,
        description: await enhanceDescription(card.description, iterationNumber)
      }))
    );
  }

  return refinedContent;
}

function generateFeatureCards(project: any) {
  const features = project.audience_analysis?.keyFeatures || [];
  return features.slice(0, 3).map((feature: string) => ({
    title: feature,
    description: "Industry-leading solutions tailored to your needs"
  }));
}

function generateBenefitItems(project: any) {
  const benefits = project.audience_analysis?.benefits || [];
  return benefits.slice(0, 3).map((benefit: string) => ({
    title: benefit,
    description: "Proven results for your business"
  }));
}

function generateTestimonials(targetAudience: any) {
  return [{
    quote: "A game-changing solution that transformed our business.",
    author: "Jane Smith",
    role: targetAudience.demographics || "CEO"
  }];
}

async function enhanceDescription(description: string, iterationNumber: number) {
  // In a real implementation, this would use AI to enhance the description
  // For now, we'll just add an indicator that it's been refined
  return `${description} (Refined v${iterationNumber})`;
}
