
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface GenerateLandingPageRequest {
  projectId: string;
  businessIdea: any;
  targetAudience: any;
  userId: string;
  currentContent?: any;
  isRefinement?: boolean;
  iterationNumber?: number;
}

const generateContent = async (businessIdea: any, targetAudience: any, iterationNumber: number = 1) => {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  const prompt = `Create a dynamic landing page content structure for this business:

Business Details:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify(targetAudience, null, 2)}

Design a unique landing page structure that best converts this target audience. You have complete creative freedom.

Return a JSON object with this structure:
{
  "sections": [
    {
      "type": string (any section type that makes sense for this business),
      "order": number (position in the page),
      "layout": {
        "style": string (grid, columns, carousel, split, centered, etc),
        "background": string (solid, gradient, pattern, image),
        "spacing": string (compact, normal, spacious),
        "width": string (contained, full, narrow)
      },
      "content": {
        "title": string,
        "subtitle"?: string,
        "description"?: string,
        "items"?: array of content items,
        "primaryCta"?: { text: string, action: string },
        "secondaryCta"?: { text: string, action: string },
        "media"?: { type: string, url?: string, alt?: string }
      },
      "style": {
        "textAlign": string (left, center, right),
        "colorScheme": string (light, dark, custom),
        "accentColor"?: string,
        "animation"?: string
      }
    }
  ],
  "theme": {
    "primary": string (color),
    "secondary": string (color),
    "background": string (color),
    "text": string (color),
    "fonts": {
      "heading": string,
      "body": string
    }
  }
}

Focus on creating a unique structure that best serves this specific business and audience. Don't follow a rigid template.`;

  try {
    console.log('Sending request to OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: "system",
            content: "You are an expert landing page designer focused on conversion rate optimization. Design unique, effective landing pages tailored to each business."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Received response from OpenAI');
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    const content = JSON.parse(data.choices[0].message.content.trim());
    return content;
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
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

    const { projectId, businessIdea, targetAudience, userId, iterationNumber = 1 } = await req.json() as GenerateLandingPageRequest;

    console.log('Generating content for project:', projectId);
    
    // Log generation start
    const { data: logData, error: logError } = await supabaseClient
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'generation_started',
        step_details: { stage: 'started', timestamp: new Date().toISOString() },
        request_payload: { businessIdea, targetAudience, iterationNumber }
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging generation start:', logError);
      throw logError;
    }

    const content = await generateContent(businessIdea, targetAudience, iterationNumber);

    // Update the existing landing page with the new content
    const { data: landingPage, error: updateError } = await supabaseClient
      .from('landing_pages')
      .update({ 
        content,
        content_iterations: iterationNumber,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating landing page:', updateError);
      throw updateError;
    }

    // Update the log with success
    await supabaseClient
      .from('landing_page_generation_logs')
      .update({
        status: 'completed',
        success: true,
        step_details: { stage: 'content_generated', timestamp: new Date().toISOString() },
        response_payload: { content }
      })
      .eq('id', logData.id);

    return new Response(
      JSON.stringify({ content, landingPage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
