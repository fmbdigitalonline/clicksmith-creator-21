import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateAudiences } from "./handlers/audienceGeneration.ts";
import { generateHooks } from "./handlers/hookGeneration.ts";
import { generateImagePrompts } from "./handlers/imagePromptGeneration.ts";
import { generateCampaign } from "./handlers/campaignGeneration.ts";
import { analyzeAudience } from "./handlers/audienceAnalysis.ts";

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
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed. Only POST requests are accepted.`);
    }

    // Validate Content-Type header
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Content-Type must be application/json');
    }

    // Ensure request has a body and parse it
    const text = await req.text();
    if (!text) {
      throw new Error('Empty request body');
    }

    console.log('Raw request body:', text);
    
    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      console.error('JSON parsing error:', e);
      throw new Error(`Invalid JSON in request body: ${e.message}`);
    }

    // Validate required fields
    const { type, businessIdea, targetAudience, regenerationCount, timestamp, forceRegenerate } = body;
    
    if (!type) {
      throw new Error('type is required in request body');
    }

    console.log('Processing request:', { type, timestamp, regenerationCount, forceRegenerate });

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
      case 'images':
        console.log('Generating image prompts with params:', { businessIdea, targetAudience });
        responseData = await generateImagePrompts(businessIdea, targetAudience);
        break;
      case 'complete':
        console.log('Generating complete ad with params:', { businessIdea, targetAudience });
        responseData = await generateCampaign(businessIdea, targetAudience);
        break;
      case 'analysis':
        console.log('Analyzing audience with params:', { businessIdea, targetAudience });
        responseData = await analyzeAudience(businessIdea, targetAudience);
        break;
      case 'campaign':
        console.log('Generating campaign with params:', { businessIdea, targetAudience });
        responseData = await generateCampaign(businessIdea, targetAudience);
        break;
      default:
        throw new Error(`Unsupported generation type: ${type}`);
    }

    // Ensure responseData is properly serializable
    const safeResponseData = JSON.parse(JSON.stringify(responseData));

    return new Response(JSON.stringify(safeResponseData), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  } catch (error) {
    console.error('Error in generate-ad-content function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      details: error instanceof Error ? error.stack : undefined
    }), {
      status: 400,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});