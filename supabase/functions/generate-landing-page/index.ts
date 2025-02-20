import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@4.28.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, businessIdea, targetAudience, userId } = await req.json();

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });
    const openai = new OpenAIApi(configuration);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase environment variables');
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating landing page content for project:', projectId);

    // Generate hero image prompt
    const heroImagePrompt = `Create a professional, high-quality image for a business website. 
    Business: ${businessIdea}
    Target audience: ${targetAudience}
    The image should be modern, professional, and appropriate for a business website.
    Style: Clean, professional, modern corporate style.
    Make it suitable as a hero image that will have text overlay.`;

    // Generate hero image using DALL-E
    console.log('Generating hero image...');
    const heroImageResponse = await openai.createImage({
      prompt: heroImagePrompt,
      n: 1,
      size: "1024x1024",
      model: "dall-e-3",
    });

    const heroImageUrl = heroImageResponse.data.data[0].url;
    console.log('Hero image generated:', heroImageUrl);

    // Generate landing page sections with the hero image
    const landingPageContent = {
      sections: [
        {
          type: 'hero',
          order: 0,
          content: {
            title: "Transform Your Business Vision into Reality",
            subtitle: "Innovative solutions tailored for your success",
            imageUrl: heroImageUrl,
            primaryCta: {
              text: "Get Started",
              description: "Begin your journey"
            },
            secondaryCta: {
              text: "Learn More",
              description: "Discover our solutions"
            }
          }
        },
        // ... Additional sections would go here
      ]
    };

    // Store the landing page content
    const { data: landingPage, error: upsertError } = await supabase
      .from('landing_pages')
      .upsert({
        project_id: projectId,
        user_id: userId,
        content: landingPageContent,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (upsertError) throw upsertError;

    // Log success
    console.log('Landing page content generated and stored successfully');

    return new Response(JSON.stringify({ content: landingPageContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating landing page:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
