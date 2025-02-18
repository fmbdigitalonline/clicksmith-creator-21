
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import Replicate from "https://esm.sh/replicate@0.25.2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface BusinessIdea {
  description?: string;
  valueProposition?: string;
}

interface TargetAudience {
  description?: string;
  coreMessage?: string;
  messagingApproach?: string;
  painPoints?: string[];
  benefits?: string[];
}

interface RequestBody {
  projectId: string;
  businessName: string;
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectId, businessName, businessIdea, targetAudience } = await req.json() as RequestBody;
    console.log('Received request:', { businessName, businessIdea, targetAudience });

    // 1. Generate theme and styling using DeepSeek
    const themePrompt = `Create a modern, professional website theme for a business that: ${businessIdea?.description}. 
    Target audience: ${targetAudience?.description}. 
    Include recommendations for: color scheme (with hex codes), typography (specify Google Fonts), and overall style. 
    Format the response as JSON with properties: colors (object with primary, secondary, accent, background, text), 
    fonts (object with heading and body fonts), and styleDescription (string).`;

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get('DEEPSEEK_API_KEY')}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: themePrompt }],
        temperature: 0.7
      })
    });

    const themeData = await response.json();
    console.log('Theme generation response:', themeData);
    const theme = JSON.parse(themeData.choices[0].message.content);

    // 2. Generate hero image using Replicate
    const replicate = new Replicate({
      auth: Deno.env.get('REPLICATE_API_TOKEN') || '',
    });

    const imagePrompt = `Create a modern, professional hero image for: ${businessIdea?.description}. 
    Target audience: ${targetAudience?.description}. Style: clean, minimalist, corporate photography, 
    using colors that match: ${theme.colors.primary} and ${theme.colors.secondary}`;
    
    console.log('Generating hero image with prompt:', imagePrompt);
    
    const heroImage = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: {
          prompt: imagePrompt,
          num_outputs: 1,
          aspect_ratio: "16:9",
          output_format: "webp",
          output_quality: 95
        }
      }
    );

    // 3. Generate compelling content using DeepSeek
    const contentPrompt = `Create professional landing page content for a business that: ${businessIdea?.description}. 
    Target audience: ${targetAudience?.description}. Pain points: ${targetAudience?.painPoints?.join(', ')}. 
    Benefits: ${targetAudience?.benefits?.join(', ')}. 
    Format the response as JSON with the following structure:
    {
      "hero": { "title": "compelling headline", "description": "engaging subheadline" },
      "valueProposition": { "title": "", "description": "", "cards": [] },
      "features": { "title": "", "description": "", "items": [] }
    }`;

    const contentResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get('DEEPSEEK_API_KEY')}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: contentPrompt }],
        temperature: 0.7
      })
    });

    const contentData = await contentResponse.json();
    console.log('Content generation response:', contentData);
    const content = JSON.parse(contentData.choices[0].message.content);

    // 4. Combine everything into the landing page content structure
    const landingPageContent = {
      hero: {
        title: content.hero.title,
        description: content.hero.description,
        cta: "Get Started Now",
        image: Array.isArray(heroImage) && heroImage.length > 0 ? heroImage[0] : heroImage
      },
      valueProposition: content.valueProposition,
      features: content.features,
      styling: {
        colors: theme.colors,
        fonts: theme.fonts,
        styleDescription: theme.styleDescription
      }
    };

    console.log('Final landing page content:', landingPageContent);

    // 5. Save to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const { error: updateError } = await supabase
      .from('landing_pages')
      .upsert({
        project_id: projectId,
        title: businessName,
        content: landingPageContent,
        styling: theme,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('Error updating landing page:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify(landingPageContent),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in generate-landing-page:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
