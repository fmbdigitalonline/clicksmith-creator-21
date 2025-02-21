import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateAudiences } from "./handlers/audienceGeneration.ts";
import { generateHooks } from "./handlers/hookGeneration.ts";
import { generateImagePrompts } from "./handlers/imagePromptGeneration.ts";
import { generateCampaign } from "./handlers/campaignGeneration.ts";
import { analyzeAudience } from "./handlers/audienceAnalysis.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { BusinessIdea, TargetAudience, AdHook } from "./types.ts";

interface AdCopy {
  content: string;
  tone?: string;
}

interface AdVariant {
  platform: string;
  headline: string;
  description: string;
  imageUrl?: string;
  image?: {
    url: string;
    prompt: string;
  };
  size?: {
    width: number;
    height: number;
    label: string;
  };
}

const sanitizeJson = (obj: any) => {
  return JSON.parse(JSON.stringify(obj));
};

const distributeVariations = (
  headlines: string[],
  adCopies: AdCopy[],
  images: Array<{ 
    url: string; 
    width: number; 
    height: number; 
    label: string; 
    prompt: string;
  }>,
  platforms: string[]
): AdVariant[] => {
  const variants: AdVariant[] = [];
  let variationIndex = 0;

  for (const platform of platforms) {
    for (const image of images) {
      for (let i = 0; i < 2; i++) {
        const currentIndex = variationIndex % 6;
        
        variants.push({
          platform,
          headline: headlines[currentIndex],
          description: adCopies[currentIndex].content,
          imageUrl: image.url,
          image: {
            url: image.url,
            prompt: image.prompt
          },
          size: {
            width: image.width,
            height: image.height,
            label: image.label
          }
        });

        variationIndex++;
      }
    }
  }

  return variants;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, platform, businessIdea, targetAudience, adHooks } = await req.json();

    console.log('Received request:', { type, platform, businessIdea });

    if (type === 'complete_ads') {
      console.log('Generating complete ads for platform:', platform);
      
      const campaign = await generateCampaign(
        businessIdea,
        targetAudience,
        adHooks,
        platform
      );

      console.log('Generated campaign headlines and copies');
      
      const images = await generateImagePrompts(
        businessIdea,
        targetAudience,
        adHooks,
        platform
      );

      console.log('Generated images with prompts:', images);

      const variants = distributeVariations(
        campaign.headlines,
        campaign.adCopies,
        images,
        [platform]
      );

      console.log('Generated variants:', variants);

      return new Response(
        JSON.stringify({
          success: true,
          variants: sanitizeJson(variants)
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (type === 'audiences') {
      const audiences = await generateAudiences(businessIdea);
      return new Response(
        JSON.stringify({
          success: true,
          audiences: sanitizeJson(audiences)
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (type === 'hooks') {
      const hooks = await generateHooks(businessIdea, targetAudience);
      return new Response(
        JSON.stringify({
          success: true,
          hooks: sanitizeJson(hooks)
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (type === 'analyze_audience') {
      const analysis = await analyzeAudience(businessIdea, targetAudience);
      return new Response(
        JSON.stringify({
          success: true,
          analysis: sanitizeJson(analysis)
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
