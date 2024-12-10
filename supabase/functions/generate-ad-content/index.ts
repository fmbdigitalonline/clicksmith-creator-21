import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleAudienceAnalysis } from "./handlers/audienceAnalysis.ts";
import { handleAudienceGeneration } from "./handlers/audienceGeneration.ts";
import { handleCampaignGeneration } from "./handlers/campaignGeneration.ts";
import { handleHookGeneration } from "./handlers/hookGeneration.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, businessIdea, targetAudience, audienceAnalysis } = await req.json();
    console.log('Request received:', { type, businessIdea, targetAudience, audienceAnalysis });

    let result;
    switch (type) {
      case 'audience_analysis':
        result = await handleAudienceAnalysis(businessIdea, targetAudience, openAIApiKey);
        break;
      case 'audience':
        result = await handleAudienceGeneration(businessIdea, openAIApiKey);
        break;
      case 'campaign':
        result = await handleCampaignGeneration(businessIdea, targetAudience, audienceAnalysis, openAIApiKey);
        break;
      default:
        result = await handleHookGeneration(businessIdea, targetAudience, openAIApiKey);
    }

    return new Response(
      JSON.stringify(result),
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