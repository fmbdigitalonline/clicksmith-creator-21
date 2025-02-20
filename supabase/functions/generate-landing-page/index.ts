
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";
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

    // Initialize Replicate client
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY is not set');
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase environment variables');
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating landing page content for project:', projectId);

    // Generate hero image prompt
    const heroImagePrompt = `Professional website hero image for:
    ${businessIdea?.description || 'A modern business'}. 
    Target audience: ${targetAudience?.description || 'professionals'}.
    Style: Clean, modern, corporate, professional photography style.
    High quality, suitable for website hero section with text overlay.
    No text, no watermarks, no logos.`;

    // Generate hero image using Replicate
    console.log('Generating hero image with prompt:', heroImagePrompt);
    const imageOutput = await replicate.run(
      "black-forest-labs/flux-1.1-pro-ultra",
      {
        input: {
          prompt: heroImagePrompt,
          negative_prompt: "blur, watermark, text, logo, signature, low quality",
          num_inference_steps: 50,
          guidance_scale: 7.5,
          width: 1024,
          height: 576, // 16:9 aspect ratio for hero image
          style_preset: "photographic",
          num_outputs: 1
        }
      }
    );

    console.log('Image generation response:', imageOutput);
    const heroImageUrl = Array.isArray(imageOutput) ? imageOutput[0] : imageOutput;

    if (!heroImageUrl) {
      throw new Error('Failed to generate hero image');
    }

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
        }
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
