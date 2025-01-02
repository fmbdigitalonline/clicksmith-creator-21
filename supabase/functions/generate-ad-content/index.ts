import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateAudiences } from "./handlers/audienceGeneration.ts";
import { generateHooks } from "./handlers/hookGeneration.ts";
import { generateImagePrompts } from "./handlers/imagePromptGeneration.ts";
import { generateCampaign } from "./handlers/campaignGeneration.ts";
import { analyzeAudience } from "./handlers/audienceAnalysis.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Helper function to sanitize JSON strings
const sanitizeJson = (obj: unknown): unknown => {
  if (typeof obj === 'string') {
    // Remove control characters and properly escape special characters
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

serve(async (req) => {
  try {
    // Log incoming request details
    console.log('Edge Function received request:', { 
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    // Handle CORS preflight requests
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

    // Validate request method
    if (!['GET', 'POST'].includes(req.method)) {
      throw new Error(`Method ${req.method} not allowed. Only GET and POST requests are accepted.`);
    }

    // Parse and validate the request body
    let body;
    try {
      const text = await req.text();
      console.log('Raw request body:', text);
      
      if (text) {
        body = JSON.parse(text);
        // Sanitize the parsed JSON
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

    // Validate required fields
    const { type, businessIdea, targetAudience, regenerationCount = 0, timestamp, forceRegenerate = false, campaign } = body;
    
    if (!type) {
      throw new Error('type is required in request body');
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
      case 'images':
        console.log('Generating complete ad campaign with params:', { businessIdea, targetAudience, campaign });
        try {
          // First generate the campaign content
          const campaignData = await generateCampaign(businessIdea, targetAudience);
          console.log('Campaign data generated:', campaignData);
          
          // Then generate images based on the campaign
          const imageData = await generateImagePrompts(businessIdea, targetAudience, campaignData.campaign);
          console.log('Image data generated:', imageData);
          
          // Sanitize the response data
          responseData = sanitizeJson({
            variants: campaignData.campaign.adCopies.map((copy: any, index: number) => ({
              platform: campaign?.platform || 'facebook',
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
      default:
        throw new Error(`Unsupported generation type: ${type}`);
    }

    // Sanitize the final response data
    const sanitizedResponse = sanitizeJson(responseData);
    console.log('Edge Function response data:', sanitizedResponse);

    // Return success response with CORS headers
    return new Response(JSON.stringify(sanitizedResponse), {
      status: 200,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in generate-ad-content function:', error);
    
    // Return error response with CORS headers
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