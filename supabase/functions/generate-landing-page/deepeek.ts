import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from '@supabase/supabase-js'

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
  food: {
    fonts: {
      heading: 'Lora',
      body: 'Open Sans',
    },
    colors: {
      primary: '#EF4444',
      secondary: '#FEF7CD',
      accent: '#DC2626',
    },
    style: {
      borderRadius: 'rounded-xl',
      spacing: 'cozy',
    },
  },
  education: {
    fonts: {
      heading: 'Source Sans Pro',
      body: 'Inter',
    },
    colors: {
      primary: '#2563EB',
      secondary: '#F2FCE2',
      accent: '#1D4ED8',
    },
    style: {
      borderRadius: 'rounded-lg',
      spacing: 'structured',
    },
  },
  finance: {
    fonts: {
      heading: 'Inter',
      body: 'Source Sans Pro',
    },
    colors: {
      primary: '#1A1F2C',
      secondary: '#F1F1F1',
      accent: '#0F172A',
    },
    style: {
      borderRadius: 'rounded-sm',
      spacing: 'professional',
    },
  },
  fitness: {
    fonts: {
      heading: 'Roboto',
      body: 'Inter',
    },
    colors: {
      primary: '#059669',
      secondary: '#ECFDF5',
      accent: '#047857',
    },
    style: {
      borderRadius: 'rounded-lg',
      spacing: 'energetic',
    },
  },
  realestate: {
    fonts: {
      heading: 'Playfair Display',
      body: 'Source Sans Pro',
    },
    colors: {
      primary: '#334155',
      secondary: '#F8FAFC',
      accent: '#1E293B',
    },
    style: {
      borderRadius: 'rounded-md',
      spacing: 'elegant',
    },
  },
  creative: {
    fonts: {
      heading: 'Montserrat',
      body: 'Open Sans',
    },
    colors: {
      primary: '#7C3AED',
      secondary: '#F3E8FF',
      accent: '#6D28D9',
    },
    style: {
      borderRadius: 'rounded-2xl',
      spacing: 'artistic',
    },
  }
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
          content: "You are a business categorization expert. Categorize the business into one of these categories: luxury, technology, automotive, health, food, education, finance, fitness, realestate, creative. Return ONLY the category name, nothing else.",
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

const generateHeroSection = async (businessIdea: string, targetAudience: string, theme: ThemeConfig) => {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OpenAI API key not found");

  const prompt = `Given the business idea "${businessIdea}" and the target audience "${targetAudience}", generate compelling hero section content for a landing page.
  The theme of the landing page is: fonts - heading: ${theme.fonts.heading}, body: ${theme.fonts.body}; colors - primary: ${theme.colors.primary}, secondary: ${theme.colors.secondary}, accent: ${theme.colors.accent}; style - borderRadius: ${theme.style.borderRadius}, spacing: ${theme.style.spacing}.
  Include a concise headline, a brief description, and a call to action. The tone should be engaging and persuasive.`;

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
          content: "You are an expert copywriter specializing in landing pages.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate hero section content');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim();
  return content;
};

const generateSocialProofSection = async (businessIdea: string, theme: ThemeConfig) => {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OpenAI API key not found");

  const prompt = `Given the business idea "${businessIdea}", generate compelling social proof section content for a landing page.
  The theme of the landing page is: fonts - heading: ${theme.fonts.heading}, body: ${theme.fonts.body}; colors - primary: ${theme.colors.primary}, secondary: ${theme.colors.secondary}, accent: ${theme.colors.accent}; style - borderRadius: ${theme.style.borderRadius}, spacing: ${theme.style.spacing}.
  Include three short testimonials that highlight the benefits of the product or service.`;

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
          content: "You are an expert copywriter specializing in landing pages.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate social proof section content');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim();
  return content;
};

const generateFeatureSection = async (businessIdea: string, theme: ThemeConfig) => {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OpenAI API key not found");

  const prompt = `Given the business idea "${businessIdea}", generate compelling feature section content for a landing page.
  The theme of the landing page is: fonts - heading: ${theme.fonts.heading}, body: ${theme.fonts.body}; colors - primary: ${theme.colors.primary}, secondary: ${theme.colors.secondary}, accent: ${theme.colors.accent}; style - borderRadius: ${theme.style.borderRadius}, spacing: ${theme.style.spacing}.
  Include three key features with a short description for each.`;

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
          content: "You are an expert copywriter specializing in landing pages.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate feature section content');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim();
  return content;
};

const generateFaqSection = async (businessIdea: string, theme: ThemeConfig) => {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OpenAI API key not found");

  const prompt = `Given the business idea "${businessIdea}", generate compelling FAQ section content for a landing page.
  The theme of the landing page is: fonts - heading: ${theme.fonts.heading}, body: ${theme.fonts.body}; colors - primary: ${theme.colors.primary}, secondary: ${theme.colors.secondary}, accent: ${theme.colors.accent}; style - borderRadius: ${theme.style.borderRadius}, spacing: ${theme.style.spacing}.
  Include three frequently asked questions with concise answers.`;

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
          content: "You are an expert copywriter specializing in landing pages.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate FAQ section content');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim();
  return content;
};

const generateImage = async (description: string) => {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OpenAI API key not found");

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: description,
      n: 1,
      size: "1024x1024",
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate image');
  }

  const data = await response.json();
  const imageUrl = data.data[0].url;
  return imageUrl;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { projectId, businessIdea, targetAudience, userId } = await req.json();

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    if (!businessIdea) {
      throw new Error('Business idea is required');
    }

    if (!targetAudience) {
      throw new Error('Target audience is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl) {
      throw new Error('Supabase URL not found');
    }

    if (!supabaseKey) {
      throw new Error('Supabase key not found');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });

    // Log the start of the landing page generation
    await supabaseClient
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'generation_started',
        step_details: { stage: 'started' }
      });

    // Determine business category
    let businessCategory;
    try {
      businessCategory = await determineBusinessCategory(businessIdea);
      console.log(`Business category: ${businessCategory}`);
    } catch (error) {
      console.error("Failed to determine business category, defaulting to technology:", error);
      businessCategory = 'technology';
    }

    // Get theme config based on business category
    const theme = businessThemes[businessCategory] || businessThemes['technology'];

    // Generate content for hero section
    let heroSectionContent;
    try {
      await supabaseClient
        .from('landing_page_generation_logs')
        .insert({
          project_id: projectId,
          user_id: userId,
          status: 'generating_hero_content',
          step_details: { stage: 'content_generation', section: 'hero' }
        });

      heroSectionContent = await generateHeroSection(businessIdea, targetAudience, theme);
      console.log(`Hero section content: ${heroSectionContent}`);
    } catch (error) {
      console.error("Failed to generate hero section content:", error);
      await supabaseClient
        .from('landing_page_generation_logs')
        .insert({
          project_id: projectId,
          user_id: userId,
          status: 'error_generating_hero_content',
          error_message: error.message,
          step_details: { stage: 'content_generation', section: 'hero' }
        });
      heroSectionContent = 'Failed to generate hero section content.';
    }

    // Generate content for social proof section
    let socialProofSectionContent;
    try {
      await supabaseClient
        .from('landing_page_generation_logs')
        .insert({
          project_id: projectId,
          user_id: userId,
          status: 'generating_social_proof_content',
          step_details: { stage: 'content_generation', section: 'social_proof' }
        });

      socialProofSectionContent = await generateSocialProofSection(businessIdea, theme);
      console.log(`Social proof section content: ${socialProofSectionContent}`);
    } catch (error) {
      console.error("Failed to generate social proof section content:", error);
      await supabaseClient
        .from('landing_page_generation_logs')
        .insert({
          project_id: projectId,
          user_id: userId,
          status: 'error_generating_social_proof_content',
          error_message: error.message,
          step_details: { stage: 'content_generation', section: 'social_proof' }
        });
      socialProofSectionContent = 'Failed to generate social proof section content.';
    }

    // Generate content for feature section
    let featureSectionContent;
    try {
      await supabaseClient
        .from('landing_page_generation_logs')
        .insert({
          project_id: projectId,
          user_id: userId,
          status: 'generating_feature_content',
          step_details: { stage: 'content_generation', section: 'feature' }
        });

      featureSectionContent = await generateFeatureSection(businessIdea, theme);
      console.log(`Feature section content: ${featureSectionContent}`);
    } catch (error) {
      console.error("Failed to generate feature section content:", error);
      await supabaseClient
        .from('landing_page_generation_logs')
        .insert({
          project_id: projectId,
          user_id: userId,
          status: 'error_generating_feature_content',
          error_message: error.message,
          step_details: { stage: 'content_generation', section: 'feature' }
        });
      featureSectionContent = 'Failed to generate feature section content.';
    }

    // Generate content for FAQ section
    let faqSectionContent;
    try {
      await supabaseClient
        .from('landing_page_generation_logs')
        .insert({
          project_id: projectId,
          user_id: userId,
          status: 'generating_faq_content',
          step_details: { stage: 'content_generation', section: 'faq' }
        });

      faqSectionContent = await generateFaqSection(businessIdea, theme);
      console.log(`FAQ section content: ${faqSectionContent}`);
    } catch (error) {
      console.error("Failed to generate FAQ section content:", error);
      await supabaseClient
        .from('landing_page_generation_logs')
        .insert({
          project_id: projectId,
          user_id: userId,
          status: 'error_generating_faq_content',
          error_message: error.message,
          step_details: { stage: 'content_generation', section: 'faq' }
        });
      faqSectionContent = 'Failed to generate FAQ section content.';
    }

    // Generate image for hero section
    let heroSectionImage;
    try {
      await supabaseClient
        .from('landing_page_generation_logs')
        .insert({
          project_id: projectId,
          user_id: userId,
          status: 'generating_hero_image',
          step_details: { stage: 'images_generated', section: 'hero' }
        });

      heroSectionImage = await generateImage(businessIdea);
      console.log(`Hero section image: ${heroSectionImage}`);
    } catch (error) {
      console.error("Failed to generate hero section image:", error);
      await supabaseClient
        .from('landing_page_generation_logs')
        .insert({
          project_id: projectId,
          user_id: userId,
          status: 'error_generating_hero_image',
          error_message: error.message,
          step_details: { stage: 'images_generated', section: 'hero' }
        });
      heroSectionImage = 'https://source.unsplash.com/1024x768/?business';
    }

    // Structure the landing page content
    const landingPageContent = {
      theme: theme,
      sections: [
        {
          type: 'hero',
          order: 1,
          content: {
            headline: heroSectionContent.split('\n')[0],
            description: heroSectionContent.split('\n').slice(1).join('\n'),
            image: heroSectionImage,
          },
        },
        {
          type: 'social-proof',
          order: 2,
          content: {
            testimonials: socialProofSectionContent.split('\n'),
          },
        },
        {
          type: 'features',
          order: 3,
          content: {
            features: featureSectionContent.split('\n'),
          },
        },
        {
          type: 'faq',
          order: 4,
          content: {
            questions: faqSectionContent.split('\n'),
          },
        },
      ],
    };

    // Update the landing page in the database
    const { data, error } = await supabaseClient
      .from('landing_pages')
      .update({
        content: landingPageContent,
        theme_settings: theme,
        content_iterations: () => 'content_iterations + 1',
      })
      .eq('project_id', projectId)
      .select()

    if (error) {
      console.error("Failed to update landing page:", error);
      await supabaseClient
        .from('landing_page_generation_logs')
        .insert({
          project_id: projectId,
          user_id: userId,
          status: 'error_updating_landing_page',
          error_message: error.message,
          step_details: { stage: 'database_update' }
        });
      throw new Error('Failed to update landing page');
    }

    console.log("Landing page updated:", data);

    // Log the successful completion of the landing page generation
    await supabaseClient
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'generation_completed',
        success: true,
        step_details: { stage: 'completed' }
      });

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Full error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
