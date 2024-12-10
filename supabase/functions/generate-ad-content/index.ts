import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleAudienceGeneration } from './handlers/audienceGeneration.ts';
import { handleAudienceAnalysis } from './handlers/audienceAnalysis.ts';
import { handleCampaignGeneration } from './handlers/campaignGeneration.ts';
import { handleImagePromptGeneration } from './handlers/imagePromptGeneration.ts';
import { handleHookGeneration } from './handlers/hookGeneration.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, businessIdea, targetAudience, audienceAnalysis, campaign } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    let result;
    switch (type) {
      case 'audience':
        result = await handleAudienceGeneration(businessIdea, openAIApiKey);
        break;
      case 'audience_analysis':
        result = await handleAudienceAnalysis(businessIdea, targetAudience, openAIApiKey);
        break;
      case 'campaign':
        result = await handleCampaignGeneration(businessIdea, targetAudience, audienceAnalysis, openAIApiKey);
        break;
      case 'image_prompts':
        result = await handleImagePromptGeneration(businessIdea, targetAudience, campaign, openAIApiKey);
        break;
      case 'hooks':
        result = await handleHookGeneration(businessIdea, targetAudience, openAIApiKey);
        break;
      default:
        throw new Error('Invalid generation type');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});