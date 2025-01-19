import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateAudiences } from "./handlers/audienceGeneration.ts";
import { generateHooks } from "./handlers/hookGeneration.ts";
import { generateImagePrompts } from "./handlers/imagePromptGeneration.ts";
import { generateCampaign } from "./handlers/campaignGeneration.ts";
import { analyzeAudience } from "./handlers/audienceAnalysis.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Helper function to sanitize JSON strings
const sanitizeJson = (obj: unknown): unknown => {
  if (typeof obj === 'string') {
    return obj.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
             .replace(/\\/g, '\\\\')
             .replace(/"/g, '\\"')
             .replace(/\n/g, '\\n')
             .replace(/\r/g, '\\r')
             .replace(/\t/g, '\\t');
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeJson);
  }
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, sanitizeJson(value)])
    );
  }
  return obj;
};

// Valid generation types
const VALID_GENERATION_TYPES = [
  'audience',
  'hooks',
  'complete_ads',
  'video_ads',
  'audience_analysis',
  'images'
];

serve(async (req) => {
  try {
    console.log('Edge Function received request:', { 
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Max-Age': '86400',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let body;
    try {
      const text = await req.text();
      console.log('Raw request body:', text);
      
      if (text) {
        body = JSON.parse(text);
        body = sanitizeJson(body);
        console.log('Sanitized request body:', body);
      }
    } catch (e) {
      console.error('Error parsing request body:', e);
      throw new Error(`Invalid JSON in request body: ${e.message}`);
    }

    if (!body) {
      throw new Error('Empty request body');
    }

    const { type, businessIdea, targetAudience, regenerationCount = 0, timestamp, forceRegenerate = false, campaign, userId } = body;
    
    if (!type) {
      throw new Error('type is required in request body');
    }

    if (!VALID_GENERATION_TYPES.includes(type)) {
      throw new Error(`Invalid generation type: ${type}. Valid types are: ${VALID_GENERATION_TYPES.join(', ')}`);
    }

    // Check and deduct credits before generation
    if (userId && type !== 'audience_analysis') {
      const { data: creditCheck, error: creditError } = await supabase.rpc(
        'check_user_credits',
        { p_user_id: userId, required_credits: 1 }
      );

      if (creditError) {
        console.error('Error checking credits:', creditError);
        throw new Error('Failed to check credits');
      }

      const result = creditCheck[0];
      if (!result.has_credits) {
        return new Response(
          JSON.stringify({ error: 'No credits available', message: result.error_message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }

      // Deduct credits before generation
      const { data: deductResult, error: deductError } = await supabase.rpc(
        'deduct_user_credits',
        { input_user_id: userId, credits_to_deduct: 1 }
      );

      if (deductError) {
        console.error('Error deducting credits:', deductError);
        throw new Error('Failed to deduct credits');
      }

      console.log('Credits deducted successfully:', deductResult);
    }

    console.log('Processing request:', { type, timestamp });

    let responseData;
    switch (type) {
      case 'audience':
        console.log('Generating audiences with params:', { businessIdea, regenerationCount, timestamp, forceRegenerate });
        responseData = await generateAudiences(businessIdea, regenerationCount, forceRegenerate);
        break;
      case 'hooks':
        console.log('Generating hooks with params:', { businessIdea, targetAudience });
        responseData = await generateHooks(businessIdea, targetAudience);
        break;
      case 'complete_ads':
      case 'video_ads':
        console.log('Generating complete ad campaign with params:', { businessIdea, targetAudience, campaign });
        try {
          const campaignData = await generateCampaign(businessIdea, targetAudience);
          console.log('Campaign data generated:', campaignData);
          
          const imageData = await generateImagePrompts(businessIdea, targetAudience, campaignData.campaign);
          console.log('Image data generated:', imageData);
          
          responseData = sanitizeJson({
            variants: campaignData.campaign.adCopies.map((copy: any, index: number) => ({
              platform: 'facebook',
              headline: campaignData.campaign.headlines[index % campaignData.campaign.headlines.length],
              description: copy.content,
              imageUrl: imageData.images[0]?.url,
              size: {
                width: 1200,
                height: 628,
                label: "Facebook Feed"
              }
            }))
          });
        } catch (error) {
          console.error('Error generating ad content:', error);
          throw error;
        }
        break;
      case 'audience_analysis':
        console.log('Analyzing audience with params:', { businessIdea, targetAudience, regenerationCount });
        responseData = await analyzeAudience(businessIdea, targetAudience, regenerationCount);
        break;
      case 'images':
        console.log('Generating images with params:', { businessIdea, targetAudience, campaign });
        responseData = await generateImagePrompts(businessIdea, targetAudience, campaign);
        break;
      default:
        throw new Error(`Unsupported generation type: ${type}`);
    }

    const sanitizedResponse = sanitizeJson(responseData);
    console.log('Edge Function response data:', sanitizedResponse);

    return new Response(JSON.stringify(sanitizedResponse), {
      status: 200,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in generate-ad-content function:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      details: error.stack
    }), {
      status: error.status || 400,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});