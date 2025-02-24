
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentGenerationParams {
  businessIdea: {
    description: string;
    valueProposition: string;
  };
  targetAudience: {
    description: string;
    coreMessage: string;
    painPoints: string[];
    marketingAngle: string;
  };
  projectId: string;
  userId: string;
}

interface ThemeConfig {
  fonts: {
    heading: string;
    body: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  style: {
    borderRadius: string;
    spacing: string;
  };
}

const businessThemes: { [key: string]: ThemeConfig } = {
  technology: {
    fonts: {
      heading: 'Roboto',
      body: 'Open Sans',
    },
    colors: {
      primary: '#1A1F2C',
      secondary: '#D6BCFA',
      accent: '#8B5CF6',
    },
    style: {
      borderRadius: 'rounded-md',
      spacing: 'compact',
    },
  },
  fashion: {
    fonts: {
      heading: 'Playfair Display',
      body: 'Lora',
    },
    colors: {
      primary: '#333333',
      secondary: '#F5E6CC',
      accent: '#A68B70',
    },
    style: {
      borderRadius: 'rounded-full',
      spacing: 'spacious',
    },
  },
  food: {
    fonts: {
      heading: 'Montserrat',
      body: 'Source Sans Pro',
    },
    colors: {
      primary: '#4A5568',
      secondary: '#EDF2F7',
      accent: '#F6AD55',
    },
    style: {
      borderRadius: 'rounded-xl',
      spacing: 'comfortable',
    },
  },
  default: {
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
};

async function determineBusinessCategory(businessDescription: string): Promise<string> {
  const description = businessDescription.toLowerCase();

  if (description.includes("tech") || description.includes("software") || description.includes("ai")) {
    return "technology";
  } else if (description.includes("fashion") || description.includes("clothing") || description.includes("style")) {
    return "fashion";
  } else if (description.includes("food") || description.includes("restaurant") || description.includes("cooking")) {
    return "food";
  } else {
    return "default";
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, businessIdea, targetAudience, userId } = await req.json() as ContentGenerationParams;

    console.log('Received request with:', { projectId, businessIdea, targetAudience, userId });

    if (!projectId || !businessIdea || !targetAudience || !userId) {
      throw new Error('Missing required parameters');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, fetch the project title
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single();

    if (projectError) {
      throw new Error('Failed to fetch project details');
    }

    if (!project?.title) {
      throw new Error('Project title not found');
    }

    // Log generation attempt
    await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'started',
        step_details: { stage: 'started' }
      });

    const category = await determineBusinessCategory(businessIdea.description);
    console.log('Determined business category:', category);

    const theme = businessThemes[category] || businessThemes.technology;

    const content = {
      theme,
      sections: [
        {
          type: 'hero',
          order: 1,
          content: {
            headline: `${businessIdea.valueProposition}`,
            subheadline: `${targetAudience.coreMessage}`,
            ctaText: "Get Started Now"
          }
        },
        {
          type: 'social-proof',
          order: 2,
          content: {
            headline: "Trusted by Businesses Like Yours",
            testimonials: []
          }
        }
      ]
    };

    // Update landing page with title
    const { data: landingPage, error: updateError } = await supabase
      .from('landing_pages')
      .upsert({
        project_id: projectId,
        user_id: userId,
        title: project.title, // Add the title from the project
        content,
        theme_settings: theme,
        version: 1
      })
      .select()
      .single();

    if (updateError) {
      throw updateError;
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
    console.error('Error:', error.message);
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
