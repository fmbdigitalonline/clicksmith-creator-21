
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts";

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

interface ContentRequest {
  projectId: string;
  productType: string;
  businessDescription: string;
  targetAudience?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { projectId, productType, businessDescription, targetAudience } = await req.json() as ContentRequest;

    const prompt = `Write a compelling headline and subtitle combination for a landing page that promotes ${productType}. The content should follow the AIDA formula (Attention, Interest, Desire, Action) to guide the reader through the customer journey.

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

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    
    // Insert the generated content into the database
    const { data: insertedContent, error } = await supabaseClient
      .from('generated_content')
      .insert({
        project_id: projectId,
        headline: data.choices[0].message.content.headline,
        subtitle: data.choices[0].message.content.subtitle,
        content: data.choices[0].message,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        content: insertedContent,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    );
  } catch (error) {
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
