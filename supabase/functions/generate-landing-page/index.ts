import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';
import { Configuration, OpenAIApi } from 'openai';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, businessIdea, targetAudience, userId, iterationNumber = 1 } = await req.json();
    console.log('Starting landing page generation for project:', projectId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase environment variables');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the existing landing page with content
    const { data: existingPages } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('project_id', projectId)
      .order('content_iterations', { ascending: false });

    const existingPage = existingPages?.find(page => 
      page.content && Object.keys(page.content).length > 0
    ) || existingPages?.[0];

    // Check if user has enough credits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('credits_remaining')
      .eq('user_id', userId)
      .single();

    if (!subscription || subscription.credits_remaining < 1) {
      throw new Error('Insufficient credits');
    }

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });
    const openai = new OpenAIApi(configuration);

    // Generate landing page content
    const prompt = `Create a landing page content structure for a business with the following details:

Business Idea: ${JSON.stringify(businessIdea)}
Target Audience: ${JSON.stringify(targetAudience)}

Generate a complete landing page content structure with the following sections:
1. Hero section with headline, subheadline, and call to action
2. Features/Benefits section
3. Social proof section
4. How it works section
5. Pricing section (if applicable)
6. FAQ section
7. Final call to action section

Format the response as a JSON object with sections array containing ordered components.`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const landingPageContent = JSON.parse(completion.data.choices[0].message.content);

    // Update the existing landing page or create a new one
    const { data: landingPage, error: upsertError } = await supabase
      .from('landing_pages')
      .upsert({
        id: existingPage?.id, // Use existing ID if available
        project_id: projectId,
        user_id: userId,
        content: landingPageContent,
        title: existingPage?.title || "Market Testing & Validation Platform",
        content_iterations: iterationNumber,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error updating landing page:', upsertError);
      throw upsertError;
    }

    // Log the generation
    await supabase.from('landing_page_generation_logs').insert({
      project_id: projectId,
      user_id: userId,
      success: true,
      generation_time: Date.now(),
      request_payload: { businessIdea, targetAudience },
      response_payload: landingPageContent,
      step_details: {
        stage: 'content_generated',
        timestamp: new Date().toISOString()
      }
    });

    // Deduct credits
    await supabase.rpc('deduct_credits', { amount: 1, user_id: userId });

    return new Response(
      JSON.stringify({ 
        content: landingPageContent,
        project_id: landingPage.project_id,
        id: landingPage.id,
        content_iterations: landingPage.content_iterations
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Landing page generation error:', error);
    
    // Log the error
    if (error instanceof Error) {
      await supabase.from('landing_page_generation_logs').insert({
        project_id: projectId,
        user_id: userId,
        success: false,
        error_message: error.message,
        generation_time: Date.now(),
        step_details: {
          stage: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }

    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: error.message === 'Insufficient credits' ? 402 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
