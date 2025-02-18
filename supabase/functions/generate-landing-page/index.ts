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
  userId: string; // Add userId to the request body
}

// Helper function to extract JSON from DeepSeek response
const extractJsonFromResponse = (text: string) => {
  try {
    // Find the first { and last } to extract just the JSON part
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    if (start === -1 || end === 0) throw new Error('No JSON found in response');
    
    const jsonStr = text.slice(start, end);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error parsing DeepSeek response:', error);
    throw new Error('Failed to parse AI response');
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectId, businessName, businessIdea, targetAudience, userId } = await req.json() as RequestBody;
    console.log('Received request:', { businessName, businessIdea, targetAudience, userId });

    if (!userId) {
      throw new Error('User ID is required');
    }

    // 1. Generate theme and styling using DeepSeek
    const themePrompt = `Generate a JSON response for a modern, professional website theme based on this business: ${businessIdea?.description}. 
    Target audience: ${targetAudience?.description}. 
    The response should be a valid JSON object with these exact properties:
    {
      "colors": {
        "primary": "#hex",
        "secondary": "#hex",
        "accent": "#hex",
        "background": "#hex",
        "text": "#hex"
      },
      "fonts": {
        "heading": "Google Font Name",
        "body": "Google Font Name"
      },
      "styleDescription": "Brief style description"
    }`;

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
    console.log('Theme API response:', themeData);
    const theme = extractJsonFromResponse(themeData.choices[0].message.content);
    console.log('Parsed theme:', theme);

    // 2. Generate hero image using Replicate
    const replicate = new Replicate({
      auth: Deno.env.get('REPLICATE_API_TOKEN') || '',
    });

    const imagePrompt = `Create a modern, professional hero image for: ${businessIdea?.description}. 
    Target audience: ${targetAudience?.description}. Style: clean, minimalist, corporate photography.`;
    
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
    const contentPrompt = `Generate a JSON response for a landing page content based on this business: ${businessIdea?.description}. 
    Target audience: ${targetAudience?.description}. 
    The response should be a valid JSON object with these exact properties:
    {
      "hero": {
        "title": "compelling headline",
        "description": "engaging subheadline"
      },
      "valueProposition": {
        "title": "section title",
        "description": "section description",
        "cards": [
          {
            "title": "benefit 1",
            "description": "description 1"
          }
        ]
      },
      "features": {
        "title": "section title",
        "description": "section description",
        "items": [
          {
            "title": "feature 1",
            "description": "description 1"
          }
        ]
      }
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
    console.log('Content API response:', contentData);
    const content = extractJsonFromResponse(contentData.choices[0].message.content);
    console.log('Parsed content:', content);

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

    // 5. Save to database with user_id
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const { error: updateError } = await supabase
      .from('landing_pages')
      .upsert({
        project_id: projectId,
        user_id: userId, // Add the user_id here
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
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})
