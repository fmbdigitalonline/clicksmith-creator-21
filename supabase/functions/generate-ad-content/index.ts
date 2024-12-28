import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateHooks } from './handlers/hookGeneration.ts';
import { generateAudienceAnalysis } from './handlers/audienceAnalysis.ts';
import { generateCompleteAds } from './handlers/completeAdGeneration.ts';
import { generateImages } from './handlers/imagePromptGeneration.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const mockAudiences = [
  {
    name: "Young Urban Professionals",
    description: "Career-focused individuals in metropolitan areas",
    demographics: "25-35 years old, college educated, urban dwellers",
    painPoints: [
      "Limited time for personal life",
      "High stress levels",
      "Work-life balance challenges"
    ],
    icp: "Ambitious professional seeking career growth while maintaining wellness",
    coreMessage: "Achieve more without sacrificing your wellbeing",
    positioning: "Your partner in balanced success",
    marketingAngle: "Work smarter, live better",
    messagingApproach: "Professional yet empathetic, focusing on efficiency and balance",
    marketingChannels: [
      "LinkedIn",
      "Professional networking events",
      "Business podcasts"
    ]
  },
  {
    name: "Health-Conscious Parents",
    description: "Parents prioritizing family wellness",
    demographics: "30-45 years old, middle to upper-middle class, suburban",
    painPoints: [
      "Finding time for healthy meal prep",
      "Balancing family and personal health",
      "Budget constraints for premium products"
    ],
    icp: "Parent seeking healthy solutions for the whole family",
    coreMessage: "Healthy families, happy lives",
    positioning: "Your family's wellness partner",
    marketingAngle: "Make healthy living simple",
    messagingApproach: "Warm, supportive, and practical",
    marketingChannels: [
      "Facebook",
      "Parenting blogs",
      "Local community events"
    ]
  },
  {
    name: "Tech-Savvy Seniors",
    description: "Active seniors embracing modern technology",
    demographics: "60+ years old, retirement-ready or retired, tech-adopters",
    painPoints: [
      "Keeping up with technology changes",
      "Finding user-friendly solutions",
      "Maintaining independence"
    ],
    icp: "Active senior seeking to stay connected and independent",
    coreMessage: "Stay connected, stay independent",
    positioning: "Technology made simple for active living",
    marketingAngle: "Embrace the digital age with confidence",
    messagingApproach: "Clear, respectful, and encouraging",
    marketingChannels: [
      "Facebook",
      "Senior community centers",
      "Local workshops"
    ]
  }
];

serve(async (req) => {
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  }

  try {
    const { type, businessIdea, targetAudience, campaign, regenerationCount = 0, timestamp, forceRegenerate } = await req.json();
    console.log('Request payload:', { type, businessIdea, targetAudience, regenerationCount, timestamp, forceRegenerate });

    let responseData;
    switch (type) {
      case 'audience':
        console.log('Generating audiences for business idea:', businessIdea);
        responseData = {
          audiences: mockAudiences
        };
        break;
      case 'hooks':
        responseData = await generateHooks(businessIdea, targetAudience);
        break;
      case 'audience_analysis':
        responseData = await generateAudienceAnalysis(businessIdea, targetAudience);
        break;
      case 'complete_ads':
        responseData = await generateCompleteAds(businessIdea, targetAudience, campaign, regenerationCount);
        break;
      case 'images':
        responseData = await generateImages(businessIdea, targetAudience);
        break;
      case 'video_ads':
        responseData = await generateCompleteAds(businessIdea, targetAudience, campaign, regenerationCount);
        break;
      default:
        throw new Error(`Unsupported generation type: ${type}`);
    }

    console.log('Generated response:', responseData);

    return new Response(JSON.stringify(responseData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error in generate-ad-content:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      details: error.stack,
      timestamp: new Date().toISOString(),
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
});