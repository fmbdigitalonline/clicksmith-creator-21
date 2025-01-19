import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1";
import { corsHeaders } from "../_shared/cors.ts";

const PLATFORM_FORMATS = {
  facebook: {
    feed: { width: 1200, height: 628, label: "Facebook Feed" },
    video: { width: 1280, height: 720, label: "Facebook Video" },
    story: { width: 1080, height: 1920, label: "Facebook Story" }
  },
  google: {
    display: { width: 1200, height: 628, label: "Google Display" },
    responsive: { width: 1200, height: 628, label: "Google Responsive" },
    video: { width: 1920, height: 1080, label: "Google Video" },
    square: { width: 1080, height: 1080, label: "Google Square" }
  },
  linkedin: {
    feed: { width: 1200, height: 627, label: "LinkedIn Feed" },
    video: { width: 1920, height: 1080, label: "LinkedIn Video" },
    spotlight: { width: 300, height: 250, label: "LinkedIn Spotlight" }
  },
  tiktok: {
    feed: { width: 1080, height: 1920, label: "TikTok Feed" },
    video: { width: 1080, height: 1920, label: "TikTok Video" },
    spark: { width: 1080, height: 1920, label: "TikTok Spark Ads" }
  }
};

type Platform = "facebook" | "google" | "linkedin" | "tiktok";

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

const generatePlatformSpecificAd = async (platform: Platform, businessIdea: any, targetAudience: any, hook: string) => {
  const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const configuration = new Configuration({
    apiKey: openAiApiKey,
  });
  const openai = new OpenAIApi(configuration);

  const platformPrompts = {
    facebook: `Create a Facebook ad that's engaging and social. Include:
      - Attention-grabbing headline (max 40 characters)
      - Compelling body text (max 125 characters)
      - Clear call to action`,
    
    google: `Create a Google ad that's direct and search-optimized. Include:
      - Headline 1 (max 30 characters)
      - Headline 2 (max 30 characters)
      - Headline 3 (max 30 characters)
      - Description 1 (max 90 characters)
      - Description 2 (max 90 characters)
      - Display URL
      - Call to action`,
    
    linkedin: `Create a professional LinkedIn ad that resonates with B2B audience. Include:
      - Professional headline (max 70 characters)
      - Descriptive body text (max 150 characters)
      - Business-focused call to action`,
    
    tiktok: `Create a TikTok ad that's trendy and engaging. Include:
      - Catchy headline (max 50 characters)
      - Creative hook text (max 100 characters)
      - Engaging call to action
      - Hashtag suggestions`
  };

  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are an expert ${platform} ads copywriter.`
      },
      {
        role: "user",
        content: `
          Business: ${businessIdea.description}
          Target Audience: ${targetAudience.description}
          Hook: ${hook}
          
          ${platformPrompts[platform]}
          
          Format the response as JSON.`
      }
    ],
  });

  const response = JSON.parse(completion.data.choices[0]?.message?.content || '{}');
  
  // Platform-specific formatting
  switch (platform) {
    case 'google':
      return {
        ...response,
        displayUrl: response.displayUrl || new URL(businessIdea.website).hostname,
        headlines: [response.headline1, response.headline2, response.headline3],
        descriptions: [response.description1, response.description2]
      };
    case 'linkedin':
      return {
        ...response,
        companyName: businessIdea.companyName,
        sponsoredLabel: "Sponsored"
      };
    case 'tiktok':
      return {
        ...response,
        hashtags: response.hashtags || [],
        soundRecommendation: response.soundSuggestion
      };
    default:
      return response;
  }
};

serve(async (req) => {
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

  try {
    const { type, platform = 'facebook', businessIdea, targetAudience, campaign } = await req.json();

    if (!PLATFORM_FORMATS[platform as Platform]) {
      throw new Error(`Unsupported platform: ${platform}. Supported platforms are: facebook, google, linkedin, tiktok`);
    }

    console.log('Processing request:', { type, platform, businessIdea, targetAudience });

    let responseData;
    switch (type) {
      case 'complete_ads':
      case 'video_ads':
        console.log('Generating complete ad campaign');
        try {
          // Generate 10 variations
          const adPromises = Array(10).fill(null).map(async (_, index) => {
            const adContent = await generatePlatformSpecificAd(
              platform as Platform,
              businessIdea,
              targetAudience,
              campaign?.hooks?.[index] || campaign?.hook || ''
            );

            const format = type === 'video_ads'
              ? PLATFORM_FORMATS[platform as Platform].video
              : PLATFORM_FORMATS[platform as Platform][platform === 'google' ? 'responsive' : 'feed'];

            return {
              id: crypto.randomUUID(),
              platform,
              ...adContent,
              size: format,
              status: 'completed'
            };
          });

          const variants = await Promise.all(adPromises);
          responseData = { variants };
        } catch (error) {
          console.error('Error generating ad content:', error);
          throw error;
        }
        break;

      default:
        throw new Error(`Unsupported generation type: ${type}`);
    }

    const sanitizedResponse = sanitizeJson(responseData);
    console.log('Response data:', sanitizedResponse);

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
