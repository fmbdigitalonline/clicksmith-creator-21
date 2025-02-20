
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
  
  const prompt = `Create a detailed, text-rich landing page content structure for this business:

Business Details:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify(targetAudience, null, 2)}

Design a unique, content-rich landing page structure that effectively communicates value to this target audience. Focus on detailed explanations, compelling copy, and thorough content in each section.

IMPORTANT: Return ONLY the raw JSON object, no markdown formatting or code block syntax.

The JSON structure should follow this format:
{
  "sections": [
    {
      "type": string (choose from: hero, story, features, valueProposition, marketingCopy, industryInsights, benefits, testimonials, callToAction),
      "order": number,
      "layout": {
        "style": string (grid, columns, carousel, split, centered),
        "background": string (solid, gradient, pattern, image),
        "spacing": string (compact, normal, spacious),
        "width": string (contained, full, narrow)
      },
      "content": {
        "title": string (compelling headline),
        "subtitle": string (supporting subheadline),
        "mainDescription": string (primary content paragraph),
        "detailedDescription": string (in-depth explanation),
        "summary": string (brief overview),
        "bulletPoints": string[] (key points or features),
        "paragraphs": [
          {
            "heading": string,
            "text": string (detailed paragraph),
            "emphasis": boolean
          }
        ],
        "items": [
          {
            "title": string,
            "description": string (detailed item description),
            "details": string[] (additional bullet points),
            "highlights": string[] (key benefits or features)
          }
        ],
        "primaryCta": { 
          "text": string,
          "action": string,
          "description": string
        },
        "secondaryCta": { 
          "text": string,
          "action": string,
          "description": string
        }
      },
      "style": {
        "textAlign": string (left, center, right),
        "colorScheme": string (light, dark, custom),
        "accentColor": string,
        "typography": {
          "headingSize": string (normal, large, xlarge),
          "bodySize": string (normal, large),
          "lineHeight": string (normal, relaxed, loose)
        }
      }
    }
  ],
  "theme": {
    "primary": string,
    "secondary": string,
    "background": string,
    "text": string,
    "fonts": {
      "heading": string,
      "body": string
    }
  }
}

Instructions for content generation:
1. Create multiple paragraphs of detailed content for each section
2. Use industry-specific terminology and examples
3. Include persuasive marketing copy that resonates with the target audience
4. Provide thorough explanations of features and benefits
5. Use a mix of short and long-form content
6. Ensure each section has a clear purpose and message
7. Include relevant statistics and data points where appropriate
8. Write in a tone that matches the business and audience
9. Include clear calls-to-action with supporting text`;

  try {
    console.log('Sending request to OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: "system",
            content: "You are an expert landing page designer and copywriter. Create detailed, persuasive content that converts. Focus on thorough explanations and compelling copy. Always return ONLY raw JSON without any markdown formatting or code blocks."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
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

    let contentString = data.choices[0].message.content.trim();
    contentString = contentString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    
    try {
      const content = JSON.parse(contentString);
      console.log('Successfully parsed content:', content);
      return content;
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      console.error('Content that failed to parse:', contentString);
      throw new Error('Failed to parse generated content as JSON');
    }
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
