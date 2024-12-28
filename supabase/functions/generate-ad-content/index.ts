import { serve } from 'https://deno.fresh.dev/std@v1/http/server.ts';
import generateCompleteAds from './handlers/completeAdGeneration.ts';
import { generateHooks } from './handlers/hookGeneration.ts';
import { generateAudienceAnalysis } from './handlers/audienceAnalysis.ts';
import { generateImages } from './handlers/imagePromptGeneration.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Vary': 'Origin',
      }
    });
  }

  try {
    // Log request details for debugging
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    const { type, businessIdea, targetAudience, regenerationCount, timestamp, forceRegenerate } = await req.json();
    console.log('Received request payload:', { type, businessIdea, targetAudience, regenerationCount, timestamp, forceRegenerate });

    let responseData;

    switch (type) {
      case 'hooks':
        responseData = await generateHooks(businessIdea, targetAudience);
        break;
      case 'audience_analysis':
        responseData = await generateAudienceAnalysis(businessIdea, targetAudience);
        break;
      case 'complete_ads':
        responseData = await generateCompleteAds(businessIdea, targetAudience, regenerationCount);
        break;
      case 'images':
        responseData = await generateImages(businessIdea, targetAudience);
        break;
      default:
        throw new Error(`Unsupported generation type: ${type}`);
    }

    console.log('Generated response data:', responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error in generate-ad-content function:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  }
});