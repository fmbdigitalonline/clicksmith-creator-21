import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.20.1";
import Replicate from "https://esm.sh/replicate@0.25.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const parseOpenAIResponse = (content: string): any => {
  try {
    // First try parsing as is
    return JSON.parse(content);
  } catch (e) {
    try {
      // Try cleaning the content if direct parsing fails
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '');
      const trimmedContent = cleanedContent.trim();
      console.log('Attempting to parse cleaned content:', trimmedContent);
      return JSON.parse(trimmedContent);
    } catch (e2) {
      console.error('Failed to parse AI response. Content:', content);
      console.error('Parse error:', e2);
      throw new Error(`Failed to parse AI response: ${e2.message}`);
    }
  }
};

const generateSectionLayout = (sectionType: string, content: any) => {
  const baseLayout = {
    type: "cards",
    backgroundColor: "#FFFFFF",
    borderTop: "border-t border-gray-100",
    borderBottom: "border-b border-gray-100",
    cardsPerRow: 3,
    cardStyle: {
      background: "#FFFFFF",
      shadow: "shadow-sm",
      border: "border border-gray-100",
      rounded: "rounded-lg",
      padding: "p-6"
    }
  };

  switch (sectionType) {
    case "hero":
      return {
        type: "hero",
        layout: "split",
        backgroundColor: "#FFFFFF",
        borderBottom: "border-b border-gray-100"
      };
    case "valueProposition":
      return {
        ...baseLayout,
        cardsPerRow: content?.cards?.length || 3,
        icons: ["✨", "🎯", "💫"] // Default icons if none provided
      };
    case "features":
      return {
        ...baseLayout,
        cardsPerRow: Math.min(content?.items?.length || 3, 3),
        icons: ["⚡️", "🔍", "🎨"] // Default icons for features
      };
    case "testimonials":
      return {
        ...baseLayout,
        cardsPerRow: 1,
        style: {
          ...baseLayout.cardStyle,
          background: "#FFFFFF",
          quoteMark: "text-gray-200 text-6xl"
        }
      };
    case "howItWorks":
      return {
        ...baseLayout,
        cardsPerRow: content?.steps?.length || 4,
        icons: ["1️⃣", "2️⃣", "3️⃣", "4️⃣"],
        dividerStyle: "border-t-2 border-dashed border-gray-100"
      };
    case "marketAnalysis":
      return {
        ...baseLayout,
        cardsPerRow: 2,
        illustration: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7"
      };
    case "objections":
      return {
        ...baseLayout,
        cardsPerRow: Math.min(content?.concerns?.length || 2, 2),
        icons: ["🤔", "💭"]
      };
    case "faq":
      return {
        ...baseLayout,
        cardsPerRow: 2,
        dividerStyle: "border-t border-gray-100"
      };
    default:
      return baseLayout;
  }
};

const saveImageToStorage = async (imageUrl: string): Promise<string> => {
  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');
    
    const imageBuffer = await response.arrayBuffer();
    const fileName = `hero_${new Date().getTime()}.webp`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('landing_page_images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      throw uploadError;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('landing_page_images')
      .getPublicUrl(fileName);

    console.log('Image saved to storage:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error saving image to storage:', error);
    throw error;
  }
};

// Map AIDA content to template structure with dynamic layout
const mapToTemplateStructure = (aidaContent: any, heroContent: any, heroImage: string) => {
  console.log("Mapping content to template structure with heroImage:", heroImage);
  
  // Create dynamic layout configuration
  const layoutConfig = {
    backgroundColor: "#FFFFFF",
    useCards: true,
    globalStyles: {
      background: "#FFFFFF",
      dividers: "border-gray-100",
      card: {
        background: "#FFFFFF",
        shadow: "shadow-sm",
        border: "border border-gray-100",
        rounded: "rounded-lg",
        padding: "p-6"
      }
    },
    sections: {
      hero: {
        type: "hero",
        layout: "split",
        backgroundColor: "#FFFFFF",
        borderBottom: "border-b border-gray-100"
      },
      valueProposition: generateSectionLayout("valueProposition", {
        cards: aidaContent.marketAnalysis.painPoints
      }),
      features: generateSectionLayout("features", {
        items: aidaContent.marketAnalysis.features
      }),
      testimonials: generateSectionLayout("testimonials", {
        items: [aidaContent.marketAnalysis.socialProof]
      }),
      howItWorks: generateSectionLayout("howItWorks", aidaContent.howItWorks),
      marketAnalysis: generateSectionLayout("marketAnalysis", aidaContent.marketAnalysis),
      objections: generateSectionLayout("objections", aidaContent.objections),
      faq: generateSectionLayout("faq", aidaContent.faq)
    }
  };

  const mappedContent = {
    hero: {
      title: heroContent.headline,
      description: `${heroContent.subtitle?.interest || ''} ${heroContent.subtitle?.desire || ''} ${heroContent.subtitle?.action || ''}`,
      cta: heroContent.subtitle?.action || "Get Started",
      image: heroImage,
      style: {
        background: "#FFFFFF",
        border: "border-b border-gray-100"
      }
    },
    layout: layoutConfig,
    valueProposition: {
      title: "Why Choose Us?",
      cards: aidaContent.marketAnalysis.painPoints.map((point: any, index: number) => ({
        icon: layoutConfig.sections.valueProposition.icons[index],
        title: point.title,
        description: point.description
      }))
    },
    features: {
      title: "Key Features",
      description: aidaContent.marketAnalysis.solution,
      items: aidaContent.marketAnalysis.features.map((feature: any, index: number) => ({
        icon: layoutConfig.sections.features.icons[index],
        title: feature.title,
        description: feature.description
      }))
    },
    testimonials: {
      title: "What Our Clients Say",
      items: [{
        quote: aidaContent.marketAnalysis.socialProof.quote,
        author: aidaContent.marketAnalysis.socialProof.author,
        role: aidaContent.marketAnalysis.socialProof.title,
        avatar: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e"
      }]
    },
    howItWorks: {
      ...aidaContent.howItWorks,
      steps: aidaContent.howItWorks.steps.map((step: any, index: number) => ({
        ...step,
        icon: layoutConfig.sections.howItWorks.icons[index]
      }))
    },
    marketAnalysis: {
      ...aidaContent.marketAnalysis,
      illustration: layoutConfig.sections.marketAnalysis.illustration
    },
    objections: {
      ...aidaContent.objections,
      concerns: aidaContent.objections.concerns.map((concern: any, index: number) => ({
        ...concern,
        icon: layoutConfig.sections.objections.icons[index]
      }))
    },
    faq: aidaContent.faq,
    cta: {
      title: "Ready to Get Started?",
      description: aidaContent.howItWorks.valueReinforcement,
      buttonText: "Get Started Now",
      style: {
        background: "#FFFFFF",
        border: "border-t border-gray-100"
      }
    },
    footerContent: {
      ...aidaContent.footerContent,
      style: {
        background: "#FFFFFF",
        border: "border-t border-gray-100"
      }
    }
  };

  console.log("Final hero section mapping:", mappedContent.hero);
  return mappedContent;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Request headers:', req.headers);
    const contentType = req.headers.get('content-type');
    console.log('Content-Type:', contentType);

    // Read request body as text first
    const bodyText = await req.text();
    console.log('Raw request body:', bodyText);

    let requestData;
    try {
      requestData = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          details: parseError.message,
          receivedBody: bodyText
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Parsed request data:', requestData);
    const { businessIdea, targetAudience, audienceAnalysis, projectImages = [] } = requestData;

    if (!businessIdea) {
      return new Response(
        JSON.stringify({
          error: 'Business idea is required',
          receivedData: requestData
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Use Replicate with Flux model for hero content
    console.log("Generating hero content with Flux model...");
    const replicate = new Replicate({
      auth: Deno.env.get('REPLICATE_API_KEY'),
    });

    const businessDescription = typeof businessIdea === 'string' 
      ? businessIdea 
      : businessIdea.name || businessIdea.description || 'this business';

    const heroPrompt = `Write a compelling headline and detailed subtitle combination for a landing page that promotes ${businessDescription}. Format your response as a JSON object with two fields: 'headline' and 'subtitle'.`;

    const heroOutput = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: {
          prompt: heroPrompt,
          system_prompt: "You are an expert copywriter specializing in landing page headlines that convert. Create highly detailed, compelling content that resonates with the target audience. Always return a valid JSON object.",
          max_tokens: 1000,
          temperature: 0.7
        }
      }
    );

    console.log("Raw hero content response:", heroOutput);
    const heroContent = parseOpenAIResponse(heroOutput);
    console.log("Parsed hero content:", heroContent);

    // Initialize DeepSeek client for the remaining content
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: Deno.env.get('DEEPSEEK_API_KEY')
    });

    // Generate the remaining AIDA template content
    console.log("Generating remaining landing page content...");
    const aidaPrompt = `
      Create a landing page content following the AIDA framework for:
      Business: ${JSON.stringify(businessDescription)}
      Target Audience: ${JSON.stringify(targetAudience)}
      Analysis: ${JSON.stringify(audienceAnalysis)}
      
      Return a JSON object with these sections: howItWorks, marketAnalysis, objections, faq, and footerContent.
    `;

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are a landing page content expert. Generate structured JSON content following the AIDA framework. Always return valid JSON."
        },
        {
          role: "user",
          content: aidaPrompt
        }
      ],
      max_tokens: 8000,
      temperature: 0.7
    });

    const aidaResponseText = completion.choices[0].message.content;
    console.log("Raw AIDA content response:", aidaResponseText);
    const aidaContent = parseOpenAIResponse(aidaResponseText);
    console.log("Parsed AIDA content:", aidaContent);

    // Handle hero image
    let heroImage = projectImages[0];
    if (!heroImage) {
      console.log("No project images found, generating hero image with Flux...");
      
      const imagePrompt = `Ultra realistic commercial photograph for a landing page with this headline: "${heroContent.headline}". Professional DSLR quality, 8k resolution, crystal clear, highly detailed commercial photography that captures the essence of: ${businessDescription}`;

      console.log("Generating image with prompt:", imagePrompt);
      
      const output = await replicate.run(
        "black-forest-labs/flux-1.1-pro",
        {
          input: {
            prompt: imagePrompt,
            negative_prompt: "cartoon, illustration, painting, drawing, art, digital art, anime, manga, low quality, blurry, watermark, text, logo",
            width: 1024,
            height: 1024,
            num_inference_steps: 40,
            guidance_scale: 7.5,
            scheduler: "K_EULER",
            num_outputs: 1
          }
        }
      );

      console.log("Replicate response:", output);
      const generatedImageUrl = Array.isArray(output) ? output[0] : output;
      
      // Save the generated image to Supabase Storage
      heroImage = await saveImageToStorage(generatedImageUrl);
      console.log("Saved hero image URL:", heroImage);
    }

    // Map the generated content to match the template structure
    const generatedContent = mapToTemplateStructure(aidaContent, heroContent, heroImage);
    console.log("Final generated content:", generatedContent);

    return new Response(
      JSON.stringify(generatedContent),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    );

  } catch (error) {
    console.error('Error in generate-landing-page function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : undefined,
        type: error.constructor.name
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    );
  }
});
