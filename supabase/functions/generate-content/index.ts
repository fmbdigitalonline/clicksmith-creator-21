
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { projectId, productType, businessDescription, targetAudience, contentType, businessIdea, images } = await req.json();

    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    let prompt = '';
    let endpoint = '';
    
    // Determine content type and create appropriate prompt
    if (contentType === 'landing_page') {
      // This is for full landing page content generation (formerly in generate-landing-page)
      prompt = `Generate landing page content and theme for a business with the following details:

Business Idea: ${businessIdea?.description || businessDescription}
Value Proposition: ${businessIdea?.valueProposition || ''}
Target Audience: ${targetAudience?.description || targetAudience || ''}
Core Message: ${targetAudience?.coreMessage || ''}
Pain Points: ${targetAudience?.painPoints ? targetAudience.painPoints.join(", ") : ''}
Marketing Angle: ${targetAudience?.marketingAngle || ''}
${images?.length ? `Use these image URLs in appropriate sections: ${images.join(", ")}` : "No images provided, leave imageUrl fields empty"}

Create a complete landing page structure including theme settings in the following JSON structure:

{
  "sections": [
    {
      "type": "hero",
      "order": 1,
      "content": {
        "title": "compelling headline focusing on main value proposition",
        "subtitle": "persuasive description emphasizing benefits",
        "imageUrl": "first project image URL if available",
        "primaryCta": {
          "text": "action-oriented button text",
          "description": "motivation to click"
        }
      }
    }
  ],
  "theme": {
    "colorScheme": {
      "primary": "choose an appropriate color based on industry and emotion",
      "secondary": "complementary color",
      "accent": "highlight color for important elements",
      "background": "main background color",
      "text": "main text color",
      "muted": "color for less important text"
    },
    "typography": {
      "headingFont": "font family for headings",
      "bodyFont": "font family for body text",
      "scale": {
        "h1": "largest heading size",
        "h2": "second level heading size",
        "h3": "third level heading size",
        "body": "body text size",
        "small": "small text size"
      }
    },
    "spacing": {
      "sectionPadding": "padding between sections",
      "componentGap": "gap between components",
      "containerWidth": "max width for content"
    },
    "style": {
      "borderRadius": "rounded corners size",
      "shadowStrength": "none | light | medium | strong",
      "containerStyle": "contained | wide | full"
    }
  }
}

Make the content compelling and persuasive. Focus on addressing the pain points and using the specified marketing angle. Include bullet points and feature highlights. Theme should reflect the business type and target audience. Return ONLY valid JSON.`;
      
      endpoint = 'https://api.openai.com/v1/chat/completions';
    } else {
      // This is for the regular headline/subtitle content generation (standard generate-content)
      prompt = `Write a compelling headline and subtitle combination for a landing page that promotes ${productType}. The content should follow the AIDA formula (Attention, Interest, Desire, Action) to guide the reader through the customer journey.

Business Description: ${businessDescription}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

Guidelines:
- Headline: 8-12 words, grab attention with key pain point/desire
- Subtitle First Sentence: 8-12 words, build interest and relevance
- Subtitle Second Sentence: 8-12 words, create desire with unique benefits
- Call-to-Action: 4-6 words, encourage next step
- Tone: Professional but approachable
- Style: Confident and solution-focused
- Avoid jargon, make it accessible to beginners`;
      
      endpoint = 'https://api.deepseek.com/v1/chat/completions';
    }

    // Select API and parameters based on content type
    const apiKey = contentType === 'landing_page' 
      ? Deno.env.get('OPENAI_API_KEY') 
      : DEEPSEEK_API_KEY;
      
    const apiParams = contentType === 'landing_page'
      ? {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert copywriter and designer specializing in landing page content that converts. Return ONLY valid JSON matching the exact structure requested.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
        }
      : {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        };

    // Make API request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiParams),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error:', errorData);
      throw new Error(`API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content generated");
    }

    let result;
    
    // Process content differently based on content type
    if (contentType === 'landing_page') {
      // Process landing page content (former generate-landing-page function)
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Parse and enhance the content with project images
      const parsedContent = JSON.parse(cleanContent);
      
      // Inject project images if available
      if (images && images.length > 0) {
        // Use first image for hero section
        if (parsedContent.sections[0]?.type === 'hero') {
          parsedContent.sections[0].content.imageUrl = images[0];
        }
        
        // Distribute remaining images across feature sections
        const featuresSection = parsedContent.sections.find(s => s.type === 'features');
        if (featuresSection && featuresSection.content.items) {
          featuresSection.content.items.forEach((item, index) => {
            if (images[index + 1]) {
              item.imageUrl = images[index + 1];
            }
          });
        }
      }
      
      // Create new landing page version
      const { data: newLandingPage, error: insertError } = await supabaseClient
        .from('landing_pages')
        .insert({
          project_id: projectId,
          user_id: businessIdea?.userId,
          content: parsedContent,
          version: 1, // The DB will auto-increment this if needed
          generation_started_at: new Date().toISOString(),
          content_iterations: 1, // First iteration
          title: `Landing Page v1`
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      result = {
        content: newLandingPage,
        message: 'Landing page generated successfully'
      };
    } else {
      // Process standard content (original generate-content function)
      // Insert the generated content into the database
      const { data: insertedContent, error } = await supabaseClient
        .from('generated_content')
        .insert({
          project_id: projectId,
          content: content,
          prompt: prompt
        })
        .select()
        .single();

      if (error) throw error;
      
      result = {
        content: insertedContent
      };
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      },
    );
  }
});
