import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.13.0/mod.ts";
import { SupabaseClient, createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts';

interface ContentGenerationParams {
  projectId: string;
  businessIdea: {
    description: string;
    valueProposition: string;
  };
  targetAudience: {
    description: string;
    coreMessage: string;
    painPoints: string[];
    marketingAngle: string;
  };
  userId: string;
}

interface ThemeConfig {
  fonts: {
    heading: string;
    body: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  style: {
    borderRadius: string;
    spacing: string;
  };
}

const businessThemes: Record<string, ThemeConfig> = {
  luxury: {
    fonts: {
      heading: 'Playfair Display',
      body: 'Montserrat',
    },
    colors: {
      primary: '#1A1F2C',
      secondary: '#D6BCFA',
      accent: '#8B5CF6',
    },
    style: {
      borderRadius: 'rounded-lg',
      spacing: 'spacious',
    },
  },
  technology: {
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    colors: {
      primary: '#0EA5E9',
      secondary: '#D3E4FD',
      accent: '#0284C7',
    },
    style: {
      borderRadius: 'rounded-xl',
      spacing: 'compact',
    },
  },
  automotive: {
    fonts: {
      heading: 'Roboto',
      body: 'Open Sans',
    },
    colors: {
      primary: '#403E43',
      secondary: '#F6F6F7',
      accent: '#1EAEDB',
    },
    style: {
      borderRadius: 'rounded',
      spacing: 'balanced',
    },
  },
  health: {
    fonts: {
      heading: 'Lora',
      body: 'Source Sans Pro',
    },
    colors: {
      primary: '#16A34A',
      secondary: '#F2FCE2',
      accent: '#15803D',
    },
    style: {
      borderRadius: 'rounded-full',
      spacing: 'comfortable',
    },
  },
};

const determineBusinessCategory = async (description: string): Promise<string> => {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OpenAI API key not found");

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a business categorization expert. Categorize the business into one of these categories: luxury, technology, automotive, health. Return ONLY the category name, nothing else.",
        },
        {
          role: "user",
          content: description,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to determine business category');
  }

  const data = await response.json();
  const category = data.choices[0]?.message?.content?.toLowerCase().trim() || 'technology';
  return category;
};

const generateLandingPageContent = async (
  businessIdea: ContentGenerationParams['businessIdea'],
  targetAudience: ContentGenerationParams['targetAudience'],
  projectImages: string[] = []
) => {
  console.log('Determining business category...');
  const category = await determineBusinessCategory(businessIdea.description);
  const theme = businessThemes[category] || businessThemes.technology;

  console.log('Selected theme category:', category);

  const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
  });

  const imageContext = projectImages.length > 0
    ? `Here are some images of the product: ${projectImages.join(", ")}`
    : "No product images available.";

  const themeContext = `
    Apply this visual theme:
    - Use ${theme.fonts.heading} for headings
    - Use ${theme.fonts.body} for body text
    - Primary color: ${theme.colors.primary}
    - Secondary color: ${theme.colors.secondary}
    - Accent color: ${theme.colors.accent}
    - Style: ${theme.style.spacing} spacing with ${theme.style.borderRadius} borders
  `;

  const prompt = `
    Generate landing page content for a business with the following details:

    Business Idea: ${businessIdea.description}
    Value Proposition: ${businessIdea.valueProposition}
    Target Audience: ${targetAudience.description}
    Core Message: ${targetAudience.coreMessage}
    Pain Points: ${targetAudience.painPoints.join(", ")}
    Marketing Angle: ${targetAudience.marketingAngle}
    ${imageContext}

    ${themeContext}

    Create sections for a landing page in the following JSON structure:
    {
      "sections": [
        {
          "type": "hero",
          "order": 1,
          "content": {
            "title": "Catchy and concise headline",
            "description": "Briefly describe the product and its benefits",
            "cta": "Compelling call to action text",
            "image": "URL of a relevant image"
          }
        },
        {
          "type": "value-proposition",
          "order": 2,
          "content": {
            "headline": "Why choose this product?",
            "points": [
              "Benefit 1 clearly stated",
              "Benefit 2 clearly stated",
              "Benefit 3 clearly stated"
            ]
          }
        },
        {
          "type": "features",
          "order": 3,
          "content": {
            "headline": "Key Features",
            "features": [
              {
                "title": "Feature 1",
                "description": "Describe the feature and its benefits"
              },
              {
                "title": "Feature 2",
                "description": "Describe the feature and its benefits"
              },
              {
                "title": "Feature 3",
                "description": "Describe the feature and its benefits"
              }
            ]
          }
        },
        {
          "type": "social-proof",
          "order": 4,
          "content": {
            "title": "What people are saying",
            "testimonials": [
              {
                "quote": "A short, impactful quote from a satisfied customer",
                "author": "Customer Name",
                "role": "Customer Title"
              },
              {
                "quote": "Another short, impactful quote",
                "author": "Customer Name",
                "role": "Customer Title"
              }
            ]
          }
        },
        {
          "type": "pricing",
          "order": 5,
          "content": {
            "headline": "Simple Pricing",
            "plans": [
              {
                "name": "Basic",
                "price": "Free",
                "features": ["Feature 1", "Feature 2"],
                "cta": "Get Started"
              },
              {
                "name": "Premium",
                "price": "$99/month",
                "features": ["All Basic Features", "Feature 3", "Feature 4"],
                "cta": "Upgrade Now"
              }
            ]
          }
        },
        {
          "type": "final-cta",
          "order": 6,
          "content": {
            "headline": "Ready to get started?",
            "description": "Reiterate the main benefits and encourage action",
            "cta": "Start Your Free Trial"
          }
        }
      ]
    }

    Ensure the content is engaging, persuasive, and tailored to the target audience.
    Each section should be concise and clearly communicate the value proposition.
    The JSON should be valid and parsable.
  `;

  console.log("Full prompt being sent to OpenAI:", prompt);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert copywriter specializing in landing page content.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const cleanContent = completion.choices[0]?.message?.content?.trim();
    console.log("Raw content from OpenAI:", cleanContent);

    if (!cleanContent) {
      throw new Error("No content returned from OpenAI");
    }

    try {
      JSON.parse(cleanContent);
    } catch (error) {
      console.error("Error parsing JSON content:", error);
      console.error("Content that failed to parse:", cleanContent);
      throw new Error("Failed to parse JSON content from OpenAI");
    }

    // Before returning, inject the theme configuration
    const parsedContent = JSON.parse(cleanContent);
    parsedContent.theme = theme;
    
    return parsedContent;

  } catch (openaiError) {
    console.error("Error during OpenAI completion:", openaiError);
    throw new Error(`OpenAI Error: ${openaiError.message}`);
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    console.log("Request body:", body);

    const { projectId, businessIdea, targetAudience, userId } = body as ContentGenerationParams;

    if (!projectId || !businessIdea || !targetAudience || !userId) {
      console.error("Missing required parameters");
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase URL or Key missing");
      return new Response(JSON.stringify({ error: "Supabase URL or Key missing" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });

    // 1. Log the start of the landing page generation
    const { error: logStartError } = await supabaseClient
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'generation_started',
        success: false,
      });

    if (logStartError) {
      console.error("Error logging generation start:", logStartError);
    }

    // 2. Generate the landing page content
    let landingPageContent;
    try {
      landingPageContent = await generateLandingPageContent(businessIdea, targetAudience);
    } catch (contentError) {
      console.error("Error generating landing page content:", contentError);

      // Log the error
      await supabaseClient
        .from('landing_page_generation_logs')
        .insert({
          project_id: projectId,
          user_id: userId,
          status: 'generation_failed',
          success: false,
          error_message: contentError.message,
        });

      return new Response(JSON.stringify({ error: contentError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 3. Upload images to storage
    const imageUrls: string[] = [];
    try {
      // Extract image URLs from the landing page content
      const imageElements: string[] = [];
      
      // Function to recursively extract image URLs from sections
      function extractImages(sections: any[]) {
        sections.forEach((section: any) => {
          if (section.content && section.content.image) {
            imageElements.push(section.content.image);
          }
          if (section.content && section.content.images && Array.isArray(section.content.images)) {
            imageElements.push(...section.content.images);
          }
          if (section.content && section.content.testimonials && Array.isArray(section.content.testimonials)) {
            section.content.testimonials.forEach((testimonial: any) => {
              if (testimonial.image) {
                imageElements.push(testimonial.image);
              }
            });
          }
          if (section.content && section.content.features && Array.isArray(section.content.features)) {
            section.content.features.forEach((feature: any) => {
              if (feature.image) {
                imageElements.push(feature.image);
              }
            });
          }
        });
      }

      if (landingPageContent && landingPageContent.sections) {
        extractImages(landingPageContent.sections);
      }

      // Upload each image to Supabase storage
      for (const imageUrl of imageElements) {
        try {
          // Fetch the image as a Blob
          const imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) {
            console.error(`Failed to fetch image from ${imageUrl}: ${imageResponse.status} ${imageResponse.statusText}`);
            continue; // Skip to the next image
          }
          const imageBlob = await imageResponse.blob();

          // Convert Blob to File
          const imageFile = new File([imageBlob], `landing-page-image-${Date.now()}.jpg`, { type: imageBlob.type });

          // Upload the image to Supabase storage
          const { data: storageData, error: storageError } = await supabaseClient.storage
            .from('landing-page-images')
            .upload(`${projectId}/${imageFile.name}`, imageFile, {
              cacheControl: '3600',
              upsert: false,
            });

          if (storageError) {
            console.error(`Failed to upload image from ${imageUrl} to storage:`, storageError);
            continue; // Skip to the next image
          }

          // Get the public URL of the uploaded image
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${storageData.path}`;
          imageUrls.push(publicUrl);
          console.log(`Image from ${imageUrl} uploaded to storage and made public at ${publicUrl}`);
        } catch (uploadError) {
          console.error(`Failed to process and upload image from ${imageUrl}:`, uploadError);
        }
      }
    } catch (imageError) {
      console.error("Error during image processing:", imageError);
    }

    // 4. Save the landing page content to the database
    try {
      const { data: existingPage, error: pageError } = await supabaseClient
        .from("landing_pages")
        .select("*")
        .eq("project_id", projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pageError) {
        console.error("Error checking for existing landing page:", pageError);
        throw pageError;
      }

      let newVersion = 1;
      if (existingPage) {
        newVersion = (existingPage.version || 0) + 1;
      }

      const { data: updatedPage, error: updateError } = await supabaseClient
        .from("landing_pages")
        .upsert([
          {
            id: existingPage?.id,
            project_id: projectId,
            user_id: userId,
            title: project?.title || 'New Landing Page',
            content: landingPageContent,
            theme_settings: {},
            content_iterations: (existingPage?.content_iterations || 0) + 1,
            version: newVersion,
          }
        ], { onConflict: 'project_id' })
        .select()
        .single();

      if (updateError) {
        console.error("Error saving landing page content:", updateError);
        throw updateError;
      }

      console.log("Landing page saved:", updatedPage);

      // 5. Log the successful generation
      const { error: logSuccessError } = await supabaseClient
        .from('landing_page_generation_logs')
        .insert({
          project_id: projectId,
          user_id: userId,
          status: 'generation_success',
          success: true,
        });

      if (logSuccessError) {
        console.error("Error logging generation success:", logSuccessError);
      }

      return new Response(JSON.stringify({ success: true, data: updatedPage }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (dbError) {
      console.error("Database error:", dbError);

      // Log the error
      await supabaseClient
        .from('landing_page_generation_logs')
        .insert({
          project_id: projectId,
          user_id: userId,
          status: 'generation_failed',
          success: false,
          error_message: dbError.message,
        });

      return new Response(JSON.stringify({ error: dbError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
