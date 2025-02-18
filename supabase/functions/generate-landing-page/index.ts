
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
  userId: string;
}

const extractJsonFromResponse = (text: string) => {
  try {
    // Remove any potential leading/trailing whitespace
    text = text.trim();
    
    // Find the first occurrence of '{' and last occurrence of '}'
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    
    if (start === -1 || end === 0) {
      console.error('No JSON object found in response:', text);
      throw new Error('No JSON found in response');
    }
    
    // Extract the JSON string
    const jsonStr = text.slice(start, end);
    
    // Try to parse, logging the attempt for debugging
    console.log('Attempting to parse JSON:', jsonStr);
    
    try {
      return JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Problematic JSON string:', jsonStr);
      
      // Attempt to clean and fix common JSON issues
      const cleanedStr = jsonStr
        .replace(/(\w+):/g, '"$1":') // Add quotes to unquoted keys
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
      
      console.log('Attempting to parse cleaned JSON:', cleanedStr);
      return JSON.parse(cleanedStr);
    }
  } catch (error) {
    console.error('Error in extractJsonFromResponse:', error);
    console.error('Original text:', text);
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

    // 1. Generate professional theme with specific brand colors and typography
    const themePrompt = `Create a professional and modern website theme JSON for: ${businessIdea?.description}. Target audience: ${targetAudience?.description}.
    Consider the business's personality and target audience's preferences.
    Return a valid JSON object with this exact structure:
    {
      "colors": {
        "primary": "#hex",
        "secondary": "#hex",
        "accent": "#hex",
        "background": "#hex",
        "text": "#hex",
        "muted": "#hex"
      },
      "fonts": {
        "heading": "font name",
        "body": "font name"
      },
      "spacing": {
        "sectionPadding": "2rem",
        "contentWidth": "1200"
      },
      "styleDescription": "description"
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
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    const themeData = await response.json();
    console.log('Theme API response:', themeData);
    const theme = extractJsonFromResponse(themeData.choices[0].message.content);
    console.log('Parsed theme:', theme);

    // 2. Generate hero image with specific style guidelines
    const replicate = new Replicate({
      auth: Deno.env.get('REPLICATE_API_TOKEN') || '',
    });

    const imagePrompt = `Create a professional hero image for ${businessName}. Business: ${businessIdea?.description}. 
    Style: Modern, minimalist, high-end corporate photography.
    Include: Clean composition, subtle brand colors, professional lighting.
    Mood: ${targetAudience?.messagingApproach || 'Professional and trustworthy'}.
    Make it perfect for a website header with text overlay.`;
    
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

    // 3. Generate AIDA-structured content with strict JSON format
    const contentPrompt = `Create a landing page content structure for ${businessName}.
    Business: ${businessIdea?.description}
    Value Proposition: ${businessIdea?.valueProposition}
    Target Audience: ${targetAudience?.description}
    Core Message: ${targetAudience?.coreMessage}

    Return a valid JSON object with this exact structure:
    {
      "hero": {
        "title": "headline",
        "description": "subheadline",
        "cta": "button text"
      },
      "valueProposition": {
        "title": "section title",
        "description": "value statement",
        "cards": [
          {
            "title": "benefit",
            "description": "explanation",
            "icon": "emoji"
          }
        ]
      },
      "features": {
        "title": "section title",
        "description": "intro",
        "items": [
          {
            "title": "feature",
            "description": "benefit",
            "icon": "emoji"
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
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    const contentData = await contentResponse.json();
    console.log('Content API response:', contentData);
    const content = extractJsonFromResponse(contentData.choices[0].message.content);
    console.log('Parsed content:', content);

    // 4. Combine everything into the landing page structure
    const landingPageContent = {
      hero: {
        title: content.hero.title,
        description: content.hero.description,
        cta: content.hero.cta,
        image: Array.isArray(heroImage) && heroImage.length > 0 ? heroImage[0] : heroImage
      },
      valueProposition: content.valueProposition,
      features: content.features,
      styling: {
        colors: theme.colors,
        fonts: theme.fonts,
        spacing: theme.spacing,
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
        user_id: userId,
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
