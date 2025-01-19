import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateAudiences } from "./handlers/audienceGeneration.ts";
import { generateHooks } from "./handlers/hookGeneration.ts";
import { generateImagePrompts } from "./handlers/imagePromptGeneration.ts";
import { generateCampaign } from "./handlers/campaignGeneration.ts";
import { analyzeAudience } from "./handlers/audienceAnalysis.ts";
import { corsHeaders } from "../_shared/cors.ts";

const PLATFORM_FORMATS = {
  facebook: {
    image: { width: 1200, height: 628, label: "Facebook Feed" },
    video: { width: 1280, height: 720, label: "Facebook Video" },
    story: { width: 1080, height: 1920, label: "Facebook Story" }
  },
  google: {
    image: { width: 1200, height: 628, label: "Google Display" },
    video: { width: 1920, height: 1080, label: "Google Video" },
    square: { width: 1080, height: 1080, label: "Google Square" }
  },
  linkedin: {
    image: { width: 1200, height: 627, label: "LinkedIn Feed" },
    video: { width: 1920, height: 1080, label: "LinkedIn Video" }
  },
  tiktok: {
    video: { width: 1080, height: 1920, label: "TikTok Video" },
    image: { width: 1080, height: 1920, label: "TikTok Feed" }
  }
};

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

    if (!['GET', 'POST'].includes(req.method)) {
      throw new Error(`Method ${req.method} not allowed. Only GET and POST requests are accepted.`);
    }

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

    const { type, platform = 'facebook', businessIdea, targetAudience, regenerationCount = 0, timestamp, forceRegenerate = false, campaign } = body;
    
    if (!type) {
      throw new Error('type is required in request body');
    }

    if (!VALID_GENERATION_TYPES.includes(type)) {
      throw new Error(`Invalid generation type: ${type}. Valid types are: ${VALID_GENERATION_TYPES.join(', ')}`);
    }

    if (!PLATFORM_FORMATS[platform as keyof typeof PLATFORM_FORMATS]) {
      throw new Error(`Unsupported platform: ${platform}. Supported platforms are: ${Object.keys(PLATFORM_FORMATS).join(', ')}`);
    }

    console.log('Processing request:', { type, timestamp, platform });

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
        console.log('Generating complete ad campaign with params:', { businessIdea, targetAudience, campaign, platform });
        try {
          const campaignData = await generateCampaign(businessIdea, targetAudience);
          console.log('Campaign data generated:', campaignData);
          
          const imageData = await generateImagePrompts(businessIdea, targetAudience, campaignData.campaign);
          console.log('Image data generated:', imageData);
          
          // Create 10 variants with platform-specific formats
          const variants = campaignData.campaign.adCopies.map((copy: any, index: number) => {
            const format = type === 'video_ads' 
              ? PLATFORM_FORMATS[platform as keyof typeof PLATFORM_FORMATS].video 
              : PLATFORM_FORMATS[platform as keyof typeof PLATFORM_FORMATS].image;

            const variant = {
              platform,
              headline: campaignData.campaign.headlines[index],
              description: copy.content,
              imageUrl: imageData.images[0]?.url,
              size: format
            };

            // Add platform-specific properties
            if (platform === 'google') {
              variant['displayUrl'] = businessIdea.website || '';
              variant['callToAction'] = 'Learn More';
            }

            return variant;
          });

          responseData = sanitizeJson({ variants });
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