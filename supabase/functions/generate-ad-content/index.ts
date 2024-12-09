import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { type, businessIdea } = await req.json();

    let prompt = '';
    if (type === 'audience') {
      prompt = `Generate 3 distinct target audiences for the following business:
      Business Description: ${businessIdea.description}
      Value Proposition: ${businessIdea.valueProposition}

      For each audience, provide:
      1. A name (short and descriptive)
      2. A detailed description (2-3 sentences)
      3. 3 specific pain points
      4. Demographics information (age, income, location, etc.)

      Format the response as a JSON array with objects containing:
      {
        "name": "string",
        "description": "string",
        "painPoints": ["string", "string", "string"],
        "demographics": "string"
      }`;
    } else {
      // Original hook generation logic
      prompt = `Create 3 compelling Facebook ad hooks for the following business:
      Business Description: ${businessIdea.description}
      Value Proposition: ${businessIdea.valueProposition}
      
      Each hook should be:
      1. Attention-grabbing
      2. Emotionally resonant with the target audience
      3. Focused on benefits and solutions
      4. Under 100 characters
      5. Include a clear call to action
      
      Format each hook on a new line, numbered 1-3.`;
    }

    console.log('Sending request to OpenAI with prompt:', prompt);

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
            role: 'system', 
            content: type === 'audience' 
              ? 'You are an expert market research analyst who identifies and describes target audiences.'
              : 'You are an expert Facebook ad copywriter who creates compelling, conversion-focused ad hooks.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    console.log('OpenAI response:', data);
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const generatedContent = data.choices[0].message.content;

    if (type === 'audience') {
      try {
        const audiences = JSON.parse(generatedContent);
        return new Response(
          JSON.stringify({ audiences }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error parsing audiences:', error);
        throw new Error('Failed to parse generated audiences');
      }
    }

    return new Response(
      JSON.stringify({ content: generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-ad-content function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});