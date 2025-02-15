import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.20.1";
import Replicate from "https://esm.sh/replicate@0.25.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const parseOpenAIResponse = (content: string): any => {
  try {
    return JSON.parse(content);
  } catch (e) {
    try {
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '');
      return JSON.parse(cleanedContent.trim());
    } catch (e2) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Failed to parse OpenAI response');
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

// Map AIDA content to template structure with dynamic layout
const mapToTemplateStructure = (aidaContent: any, heroContent: any, heroImage: string) => {
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
      hero: generateSectionLayout("hero", heroContent),
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

  return {
    hero: {
      title: heroContent.headline,
      description: `${heroContent.subtitle.interest} ${heroContent.subtitle.desire} ${heroContent.subtitle.action}`,
      cta: heroContent.subtitle.action,
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
      illustration: "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b",
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
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessIdea, targetAudience, audienceAnalysis, projectImages = [] } = await req.json();

    if (!businessIdea) {
      throw new Error('Business idea is required');
    }

    // Initialize DeepSeek client
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: Deno.env.get('DEEPSEEK_API_KEY')
    });

    // Generate hero content
    console.log("Generating hero content with AIDA formula...");
    const heroCompletion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are an expert copywriter specializing in landing page headlines that convert. You must return only valid JSON with no markdown formatting."
        },
        {
          role: "user",
          content: `Write a compelling headline and subtitle combination for a landing page that promotes ${businessIdea.name || businessIdea.description || 'this business'} following the AIDA formula.`
        }
      ]
    });

    console.log("Hero content response:", heroCompletion.choices[0].message.content);
    const heroContent = parseOpenAIResponse(heroCompletion.choices[0].message.content);

    // Generate the remaining AIDA template content
    console.log("Generating remaining landing page content...");
    const aidaPrompt = `
      Create a complete landing page content following the AIDA framework for:
      Business: ${JSON.stringify(businessIdea)}
      Target Audience: ${JSON.stringify(targetAudience)}
      Analysis: ${JSON.stringify(audienceAnalysis)}

      Return a JSON object with these sections:
      {
        "howItWorks": {
          "subheadline": "String explaining how the product solves problems",
          "steps": [
            {
              "title": "Step title",
              "description": "Step description"
            }
          ],
          "valueReinforcement": "Statement reinforcing value proposition"
        },
        "marketAnalysis": {
          "context": "Market situation analysis",
          "solution": "How the product solves market problems",
          "painPoints": [
            {
              "title": "Pain point title",
              "description": "Pain point description"
            }
          ],
          "features": [
            {
              "title": "Feature title",
              "description": "Feature benefit"
            }
          ],
          "socialProof": {
            "quote": "Customer testimonial",
            "author": "Customer name",
            "title": "Customer title"
          }
        },
        "objections": {
          "subheadline": "Trust building statement",
          "concerns": [
            {
              "question": "Potential objection",
              "answer": "Reassuring answer"
            }
          ]
        },
        "faq": {
          "subheadline": "Helpful FAQ introduction",
          "questions": [
            {
              "question": "Common question",
              "answer": "Clear answer"
            }
          ]
        },
        "footerContent": {
          "contact": "Contact information",
          "newsletter": "Newsletter signup message",
          "copyright": "Copyright text"
        }
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are a landing page content expert. Generate comprehensive, persuasive content following the AIDA framework."
        },
        {
          role: "user",
          content: aidaPrompt
        }
      ]
    });

    console.log("AIDA content response:", completion.choices[0].message.content);
    const aidaContent = parseOpenAIResponse(completion.choices[0].message.content);

    // Handle hero image
    let heroImage = projectImages[0];
    if (!heroImage) {
      console.log("No project images found, generating hero image with Replicate...");
      
      const replicate = new Replicate({
        auth: Deno.env.get('REPLICATE_API_KEY'),
      });

      const imagePrompt = `Ultra realistic commercial photograph for a landing page with this headline: "${heroContent.headline}". Professional DSLR quality, 8k resolution, crystal clear, highly detailed commercial photography that captures the essence of: ${JSON.stringify(businessIdea)}`;

      console.log("Generating image with prompt:", imagePrompt);
      
      const output = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            prompt: imagePrompt,
            width: 1024,
            height: 1024,
            num_outputs: 1,
            guidance_scale: 7.5,
            num_inference_steps: 50,
            negative_prompt: "cartoon, illustration, painting, drawing, art, digital art, anime, manga, low quality, blurry, watermark, text, logo"
          }
        }
      );

      console.log("Replicate response:", output);
      heroImage = Array.isArray(output) ? output[0] : output;
    }

    // Map the generated content to match the template structure
    const generatedContent = mapToTemplateStructure(aidaContent, heroContent, heroImage);

    return new Response(
      JSON.stringify(generatedContent),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );

  } catch (error) {
    console.error('Error in generate-landing-page function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
