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

const VALID_GENERATION_TYPES = [
  'audience',
  'hooks',
  'complete_ads',
  'video_ads',
  'audience_analysis',
  'images'
];

const getPlatformSpecificPrompt = (platform: string, businessIdea: any, targetAudience: any) => {
  console.log(`Generating platform-specific prompt for ${platform}`);
  
  switch (platform) {
    case 'tiktok':
      return `Create engaging, vertical format video ad copy for TikTok that resonates with ${targetAudience.demographics}. 
      Focus on: ${businessIdea.valueProposition}
      Keep it casual, authentic, and trend-aware.
      Format the content for vertical viewing (9:16 aspect ratio).
      Include hooks that work well with TikTok's fast-paced environment.
      
      Guidelines for TikTok:
      - Keep text concise and punchy
      - Use informal, conversational language
      - Focus on immediate value proposition
      - Include clear call-to-actions
      - Optimize for mobile-first viewing
      - Consider trending audio/music integration hints`;
    
    case 'facebook':
      return `Create professional ad copy for Facebook that highlights: ${businessIdea.valueProposition}. 
      Target audience: ${targetAudience.demographics}
      Focus on engaging storytelling and clear value proposition.`;
    
    default:
      return `Create professional ad copy for ${platform} that highlights: ${businessIdea.valueProposition}. 
      Target audience: ${targetAudience.demographics}`;
  }
};

const getPlatformAdSize = (platform: string) => {
  console.log(`Getting ad size for platform: ${platform}`);
  
  switch (platform) {
    case 'tiktok':
      return {
        width: 1080,
        height: 1920,
        label: "TikTok Feed"
      };
    case 'facebook':
      return {
        width: 1200,
        height: 628,
        label: "Facebook Feed"
      };
    default:
      return {
        width: 1200,
        height: 628,
        label: "Standard Feed"
      };
  }
}

serve(async (req) => {
  // Add CORS headers to all responses
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers,
      status: 204,
    });
  }

  try {
    console.log('Edge Function received request:', { 
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

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
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: e.message 
        }), 
        { headers, status: 400 }
      );
    }

    if (!body) {
      return new Response(
        JSON.stringify({ error: 'Empty request body' }), 
        { headers, status: 400 }
      );
    }

    const { type, businessIdea, targetAudience, platform = 'facebook', userId } = body;
    
    if (!type) {
      return new Response(
        JSON.stringify({ error: 'type is required in request body' }), 
        { headers, status: 400 }
      );
    }

    // Check and deduct credits
    if (userId && type !== 'audience_analysis') {
      const { data: creditCheck, error: creditError } = await supabase.rpc(
        'check_user_credits',
        { p_user_id: userId, required_credits: 1 }
      );

      if (creditError) {
        return new Response(
          JSON.stringify({ error: creditError.message }), 
          { headers, status: 500 }
        );
      }

      const result = creditCheck[0];
      if (!result.has_credits) {
        return new Response(
          JSON.stringify({ 
            error: 'No credits available', 
            message: result.error_message 
          }),
          { headers, status: 402 }
        );
      }

      const { error: deductError } = await supabase.rpc(
        'deduct_user_credits',
        { input_user_id: userId, credits_to_deduct: 1 }
      );

      if (deductError) {
        return new Response(
          JSON.stringify({ error: deductError.message }), 
          { headers, status: 500 }
        );
      }
    }

    console.log('Processing request:', { type, platform });

    let responseData;
    switch (type) {
      case 'complete_ads':
      case 'video_ads':
        console.log('Generating complete ad campaign with params:', { businessIdea, targetAudience, platform });
        try {
          const platformPrompt = getPlatformSpecificPrompt(platform, businessIdea, targetAudience);
          console.log('Using platform-specific prompt:', platformPrompt);
          
          const campaignData = await generateCampaign(businessIdea, targetAudience, platformPrompt);
          console.log('Campaign data generated:', campaignData);
          
          const imageData = await generateImagePrompts(businessIdea, targetAudience, campaignData.campaign);
          console.log('Image data generated:', imageData);
          
          const adSize = getPlatformAdSize(platform);
          console.log('Using ad size:', adSize);
          
          responseData = sanitizeJson({
            variants: campaignData.campaign.adCopies.map((copy: any, index: number) => ({
              platform,
              headline: campaignData.campaign.headlines[index % campaignData.campaign.headlines.length],
              description: copy.content,
              imageUrl: imageData.images[0]?.url,
              size: adSize
            }))
          });
          
          console.log('Generated ad variants:', responseData);
        } catch (error) {
          console.error('Error generating ad content:', error);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to generate ad content',
              details: error.message 
            }), 
            { headers, status: 500 }
          );
        }
        break;
      case 'audience':
        responseData = await generateAudiences(businessIdea);
        break;
      case 'hooks':
        responseData = await generateHooks(businessIdea, targetAudience);
        break;
      case 'audience_analysis':
        responseData = await analyzeAudience(businessIdea, targetAudience);
        break;
      case 'images':
        responseData = await generateImagePrompts(businessIdea, targetAudience);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unsupported generation type: ${type}` }), 
          { headers, status: 400 }
        );
    }

    const sanitizedResponse = sanitizeJson(responseData);
    console.log('Edge Function response data:', sanitizedResponse);

    return new Response(
      JSON.stringify(sanitizedResponse), 
      { headers, status: 200 }
    );
  } catch (error) {
    console.error('Error in generate-ad-content function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }), 
      { headers, status: 500 }
    );
  }
});
