
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface GenerateLandingPageRequest {
  projectId: string;
  businessName: string;
  businessIdea: any;
  targetAudience: any;
  currentContent?: any;
  isRefinement?: boolean;
  iterationNumber?: number;
}

const generateContent = async (businessIdea: any, targetAudience: any, iterationNumber: number = 1) => {
  const prompt = `Create a landing page content object for a business. Focus on being specific and compelling.

Business Details:
- Business Idea: ${JSON.stringify(businessIdea)}
- Target Audience: ${JSON.stringify(targetAudience)}
- Iteration: ${iterationNumber}

Please provide the response in the following JSON format (DO NOT include any markdown formatting or backticks, just the raw JSON):

{
  "hero": {
    "title": "compelling headline",
    "description": "engaging subheadline",
    "buttonText": "action-oriented CTA"
  },
  "features": [
    {
      "title": "feature name",
      "description": "feature benefit"
    }
  ],
  "benefits": [
    {
      "title": "benefit title",
      "description": "benefit explanation"
    }
  ],
  "testimonials": [
    {
      "quote": "positive testimonial",
      "author": "customer name",
      "role": "customer role"
    }
  ],
  "faq": {
    "items": [
      {
        "question": "common question",
        "answer": "clear answer"
      }
    ]
  },
  "cta": {
    "title": "compelling final headline",
    "description": "urgency-driven description",
    "buttonText": "final call to action"
  }
}`;

  try {
    console.log('Sending request to OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-2024-07-18', // Updated to use the specific model version
        messages: [
          {
            role: "system",
            content: "You are an expert landing page copywriter focused on conversion. Provide responses in clean JSON format without any markdown formatting or code blocks."
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

    // Clean up the response content to ensure it's valid JSON
    const cleanContent = data.choices[0].message.content.trim()
      .replace(/^```json\s*/, '') // Remove starting ```json if present
      .replace(/```$/, '')        // Remove ending ``` if present
      .trim();                    // Remove any extra whitespace

    console.log('Cleaned content:', cleanContent);

    try {
      const content = JSON.parse(cleanContent);
      return content;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content that failed to parse:', cleanContent);
      throw new Error('Failed to parse OpenAI response as JSON');
    }
  } catch (error) {
    console.error('Error in generateContent:', error);
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

    const { projectId, businessIdea, targetAudience, iterationNumber = 1 } = await req.json() as GenerateLandingPageRequest;

    console.log('Generating content for project:', projectId);
    
    // Log generation start
    const { data: logData, error: logError } = await supabaseClient
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
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
      JSON.stringify({ content }),
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
