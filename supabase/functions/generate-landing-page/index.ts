
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Business themes definition
const businessThemes = {
  luxury: {
    fonts: {
      heading: 'Playfair Display',
      body: 'Montserrat',
    },
    colors: {
      primary: '#1A1F2C',
      secondary: '#D6BCFA',
      accent: '#8B5CF6',
    },
    style: {
      borderRadius: 'rounded-lg',
      spacing: 'spacious',
    },
  },
  technology: {
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    colors: {
      primary: '#2563EB',
      secondary: '#E2E8F0',
      accent: '#3B82F6',
    },
    style: {
      borderRadius: 'rounded-md',
      spacing: 'compact',
    },
  },
  // ... Add more themes as needed
};

const determineBusinessCategory = async (description: string): Promise<string> => {
  console.log('Determining business category for:', description);
  
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    console.error('OpenAI API key not found');
    return 'technology'; // Default fallback
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a business categorization expert. Categorize the business into one of these categories: luxury, technology. Return ONLY the category name, nothing else.",
          },
          {
            role: "user",
            content: description,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return 'technology';
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.toLowerCase().trim() || 'technology';
  } catch (error) {
    console.error('Error determining business category:', error);
    return 'technology';
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, businessIdea, targetAudience, userId } = await req.json();
    console.log('Received request:', { projectId, businessIdea, targetAudience, userId });

    if (!projectId || !businessIdea || !targetAudience || !userId) {
      throw new Error('Missing required parameters');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log the start of generation
    await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'started',
        step_details: { stage: 'started' }
      });

    // Fetch project title
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single();

    if (projectError) {
      throw new Error(`Failed to fetch project details: ${projectError.message}`);
    }

    const category = await determineBusinessCategory(businessIdea.description);
    console.log('Determined category:', category);

    const theme = businessThemes[category] || businessThemes.technology;
    
    const content = {
      theme,
      sections: [
        {
          type: 'hero',
          order: 1,
          content: {
            title: businessIdea.valueProposition,
            subtitle: targetAudience.coreMessage,
            primaryCta: {
              text: "Get Started Now",
              description: "Begin your journey today"
            }
          }
        },
        {
          type: 'social-proof',
          order: 2,
          content: {
            title: "Trusted by Businesses Like Yours",
            subtitle: "See what others are saying",
            testimonials: [
              {
                quote: "This transformed our business approach",
                author: "John Doe",
                role: "CEO"
              }
            ]
          }
        }
      ]
    };

    // Create or update landing page
    const { data: landingPage, error: updateError } = await supabase
      .from('landing_pages')
      .upsert({
        project_id: projectId,
        user_id: userId,
        title: project.title || 'Landing Page',
        content,
        theme_settings: theme,
        version: 1,
        generation_status: 'completed'
      })
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update landing page: ${updateError.message}`);
    }

    // Log successful generation
    await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'completed',
        success: true,
        step_details: { stage: 'completed' }
      });

    return new Response(
      JSON.stringify({ success: true, data: landingPage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-landing-page function:', error);
    
    // Log the error
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase
        .from('landing_page_generation_logs')
        .insert({
          status: 'error',
          success: false,
          error_message: error.message,
          step_details: { stage: 'error', error: error.message }
        });
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
