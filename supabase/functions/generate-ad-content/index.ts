import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateAudiences } from "./handlers/audienceGeneration.ts";
import { generateHooks } from "./handlers/hookGeneration.ts";
import { generateImagePrompts } from "./handlers/imagePromptGeneration.ts";
import { generateCampaign } from "./handlers/campaignGeneration.ts";
import { analyzeAudience } from "./handlers/audienceAnalysis.ts";
import { corsHeaders } from "../_shared/cors.ts";

type BusinessIdea = {
  description: string;
  valueProposition: string;
};

type TargetAudience = {
  name: string;
  description: string;
  demographics: string;
  painPoints: string[];
  icp: string;
  coreMessage: string;
  positioning: string;
  marketingAngle: string;
  messagingApproach: string;
  marketingChannels: string[];
};

type AdHook = {
  text: string;
  description: string;
};

type AudienceAnalysis = {
  expandedDefinition: string;
  marketDesire: string;
  awarenessLevel: string;
  sophisticationLevel: string;
  deepPainPoints: string[];
  potentialObjections: string[];
};

type AdCopy = {
  type: "story" | "short" | "aida";
  content: string;
};

type AdVariant = {
  platform: string;
  headline: string;
  description: string;
  imageUrl: string;
	prompt: string;
  size: {
    width: number;
    height: number;
    label: string;
  };
};

const sanitizeJson = (jsonString: string): string => {
  return jsonString.replace(/[\u007F-\uFFFF]/g, (chr) => {
    return "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).substr(-4);
  });
};

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, platform, businessIdea, targetAudience, adHooks } = await req
      .json();

    if (type === "audience_analysis") {
      const analysis = await analyzeAudience(
        businessIdea as BusinessIdea,
        targetAudience as TargetAudience
      );
      return new Response(sanitizeJson(JSON.stringify(analysis)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "target_audiences") {
      const audiences = await generateAudiences(businessIdea as BusinessIdea);
      return new Response(sanitizeJson(JSON.stringify(audiences)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "ad_hooks") {
      const hooks = await generateHooks(
        businessIdea as BusinessIdea,
        targetAudience as TargetAudience
      );
      return new Response(sanitizeJson(JSON.stringify(hooks)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "image_prompts") {
      const imagePrompts = await generateImagePrompts(
        businessIdea as BusinessIdea,
        targetAudience as TargetAudience,
        adHooks as AdHook[]
      );
      return new Response(sanitizeJson(JSON.stringify(imagePrompts)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "complete_ads") {
      const platforms = [platform];
      const imageCount = 3;

      // Generate marketing campaign
      const { headlines, adCopies } = await generateCampaign(
        businessIdea as BusinessIdea,
        targetAudience as TargetAudience,
        adHooks as AdHook[]
      );

      // Generate image prompts
      const imagePrompts = await generateImagePrompts(
        businessIdea as BusinessIdea,
        targetAudience as TargetAudience,
        adHooks as AdHook[]
      );

      // Map image prompts to the desired format with platform-specific sizes
      const images = imagePrompts.map((prompt, index) => {
        const size = { width: 1080, height: 1080, label: "Square" }; // Default size

        if (platform === "google") {
          if (index % 3 === 0) size.width = 300, size.height = 250, size.label = "Medium Rectangle";
          if (index % 3 === 1) size.width = 336, size.height = 280, size.label = "Large Rectangle";
          if (index % 3 === 2) size.width = 728, size.height = 90, size.label = "Leaderboard";
        } else if (platform === "linkedin") {
          size.width = 1200, size.height = 627, size.label = "LinkedIn Feed";
        } else if (platform === "tiktok") {
          size.width = 1080, size.height = 1920, size.label = "TikTok Vertical";
        }

        return {
          url: `https://source.unsplash.com/random/1080x1080?${prompt.prompt.replace(/\s+/g, ",")}`,
          width: size.width,
          height: size.height,
          label: size.label,
					prompt: prompt.prompt
        };
      }).slice(0, imageCount);

      const variants = distributeVariations(headlines, adCopies, images, platforms);

      return new Response(
        sanitizeJson(JSON.stringify({ variants })),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("Failed to generate data:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

const distributeVariations = (
  headlines: string[], 
  adCopies: AdCopy[], 
  images: Array<{ url: string; width: number; height: number; label: string; prompt: string }>,
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
					prompt: image.prompt, // Store prompt directly on variant
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
