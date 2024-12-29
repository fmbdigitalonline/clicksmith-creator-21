import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateWithReplicate, generateVideo } from "./handlers/utils/replicateUtils.ts";
import { corsHeaders } from "./handlers/utils/corsHeaders.ts";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, businessIdea, targetAudience, campaign, timestamp } = await req.json();
    console.log('Received request:', { type, businessIdea, targetAudience, campaign, timestamp });

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Invalid user token');

    // Check credits before proceeding
    const creditsRequired = type === 'video_ads' ? 5 : 1; // Video ads cost 5 credits
    console.log(`Checking credits for user ${user.id}, required: ${creditsRequired}`);

    const { data: creditCheck, error: creditError } = await supabase.rpc(
      'check_user_credits',
      { p_user_id: user.id, required_credits: creditsRequired }
    );

    if (creditError) {
      console.error('Error checking credits:', creditError);
      throw new Error('Failed to check credits');
    }

    if (!creditCheck?.[0]?.has_credits) {
      console.log('Insufficient credits:', creditCheck?.[0]?.error_message);
      throw new Error(creditCheck?.[0]?.error_message || 'Insufficient credits');
    }

    let response;
    if (type === 'video_ads') {
      console.log('Generating video ads...');
      const videoUrl = await generateVideo(
        `Create a professional video advertisement that shows: ${businessIdea.description}. 
        Target audience: ${targetAudience.description}. 
        Style: Modern, professional video advertisement.`,
        { width: 1200, height: 628 }
      );
      
      if (!videoUrl) {
        throw new Error('Failed to generate video');
      }
      
      response = { variants: [{ 
        image: { url: videoUrl },
        type: 'video',
        headline: "Your Video Ad",
        description: businessIdea.description,
        callToAction: "Learn More"
      }] };
      
      console.log('Video generation successful:', response);
    } else {
      const imageUrl = await generateWithReplicate(
        `Create an advertisement for: ${businessIdea.description}. 
        Target audience: ${targetAudience.description}.`,
        { width: 1200, height: 628 }
      );
      response = { variants: [{ 
        image: { url: imageUrl },
        type: 'image',
        headline: "Your Image Ad",
        description: businessIdea.description,
        callToAction: "Learn More"
      }] };
    }

    // Deduct credits after successful generation
    console.log(`Deducting ${creditsRequired} credits for user ${user.id}`);
    const { data: deduction, error: deductError } = await supabase.rpc(
      'deduct_user_credits',
      { input_user_id: user.id, credits_to_deduct: creditsRequired }
    );

    if (deductError) {
      console.error('Error deducting credits:', deductError);
      throw new Error('Failed to deduct credits');
    }

    console.log('Credits deducted successfully:', deduction);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});