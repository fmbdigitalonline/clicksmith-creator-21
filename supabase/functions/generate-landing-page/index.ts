
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

    // 1. Generate professional theme with specific brand colors and typography
    const themePrompt = `Create a professional and modern website theme JSON for: ${businessIdea?.description}. Target audience: ${targetAudience?.description}.
    Consider the business's personality and target audience's preferences.
    Return a JSON with:
    {
      "colors": {
        "primary": "#hex (vibrant brand color)",
        "secondary": "#hex (complementary accent)",
        "accent": "#hex (call-to-action color)",
        "background": "#hex (light neutral)",
        "text": "#hex (readable dark)",
        "muted": "#hex (subtle accent)"
      },
      "fonts": {
        "heading": "Professional Google Font name for headings",
        "body": "Highly readable Google Font name for body text"
      },
      "spacing": {
        "sectionPadding": "spacing in rem",
        "contentWidth": "max width in pixels"
      },
      "styleDescription": "Brief style guide explanation"
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

    // 3. Generate AIDA-structured content
    const contentPrompt = `Create a complete landing page content structure for ${businessName} following the AIDA framework.
    Business Description: ${businessIdea?.description}
    Target Audience: ${targetAudience?.description}
    Pain Points: ${JSON.stringify(targetAudience?.painPoints)}
    Core Message: ${targetAudience?.coreMessage}

    Return a JSON object with these exact sections:
    {
      "hero": {
        "title": "Compelling headline that grabs attention",
        "description": "Engaging subheadline that explains value",
        "cta": "Action-oriented button text"
      },
      "valueProposition": {
        "title": "Clear benefit-focused section title",
        "description": "Compelling value statement",
        "cards": [
          {
            "title": "Key benefit 1",
            "description": "Detailed explanation",
            "icon": "Relevant emoji"
          }
        ]
      },
      "features": {
        "title": "Features section headline",
        "description": "Features introduction",
        "items": [
          {
            "title": "Feature name",
            "description": "Feature benefit",
            "icon": "Relevant emoji"
          }
        ]
      },
      "testimonials": {
        "title": "Social proof section title",
        "items": [
          {
            "quote": "Compelling testimonial",
            "author": "Name",
            "role": "Position"
          }
        ]
      },
      "pricing": {
        "title": "Clear pricing section title",
        "description": "Pricing introduction",
        "plans": [
          {
            "name": "Plan name",
            "price": "Price",
            "features": ["Feature 1", "Feature 2"]
          }
        ]
      },
      "cta": {
        "title": "Final call to action headline",
        "description": "Urgency-creating subheadline",
        "buttonText": "CTA button text"
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
      testimonials: content.testimonials,
      pricing: content.pricing,
      cta: content.cta,
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
