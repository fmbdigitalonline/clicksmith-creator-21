import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleAudienceGeneration } from './handlers/audienceGeneration.ts';
import { handleAudienceAnalysis } from './handlers/audienceAnalysis.ts';
import { handleCampaignGeneration } from './handlers/campaignGeneration.ts';
import { handleImagePromptGeneration } from './handlers/imagePromptGeneration.ts';
import { handleHookGeneration } from './handlers/hookGeneration.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!req.body) {
      throw new Error('Request body is required');
    }

    const { type, businessIdea, targetAudience, audienceAnalysis, campaign } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    if (!type) {
      throw new Error('Type is required');
    }

    console.log('Processing request of type:', type);
    console.log('Request payload:', { type, businessIdea, targetAudience, audienceAnalysis, campaign });

    let result;
    switch (type) {
      case 'audience':
        if (!businessIdea) throw new Error('Business idea is required for audience generation');
        result = await handleAudienceGeneration(businessIdea, openAIApiKey);
        break;
      case 'audience_analysis':
        if (!businessIdea || !targetAudience) throw new Error('Business idea and target audience are required for analysis');
        result = await handleAudienceAnalysis(businessIdea, targetAudience, openAIApiKey);
        break;
      case 'campaign':
        if (!businessIdea || !targetAudience || !audienceAnalysis) 
          throw new Error('Business idea, target audience, and analysis are required for campaign generation');
        result = await handleCampaignGeneration(businessIdea, targetAudience, audienceAnalysis, openAIApiKey);
        break;
      case 'hooks':
        if (!businessIdea || !targetAudience) 
          throw new Error('Business idea and target audience are required for hook generation');
        result = await handleHookGeneration(businessIdea, targetAudience, openAIApiKey);
        break;
      case 'images':
        if (!businessIdea || !targetAudience || !campaign) 
          throw new Error('Business idea, target audience, and campaign are required for image generation');
        result = await handleImagePromptGeneration(businessIdea, targetAudience, campaign, openAIApiKey);
        break;
      default:
        throw new Error('Invalid generation type');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-ad-content function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }), 
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});