
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Our landing page template based on Index.tsx structure
const landingPageTemplate = {
  id: "modern-saas",
  structure: {
    hero: {
      type: "centered",
      imagePosition: "background",
      features: ["gradient", "cta-buttons", "customer-logos"]
    },
    features: {
      type: "grid",
      columns: 3,
      style: "icon-top",
      visualStyle: "modern"
    },
    valueProposition: {
      type: "grid",
      columns: 3,
      style: "card",
      visualStyle: "highlighted"
    },
    painPoints: {
      type: "grid",
      columns: 3,
      style: "icon-left",
      visualStyle: "modern"
    },
    testimonials: {
      type: "grid",
      style: "card",
      visualStyle: "shadow"
    },
    faq: {
      type: "grid",
      columns: 2,
      style: "card",
      visualStyle: "minimal"
    },
    cta: {
      type: "centered",
      style: "gradient",
      visualStyle: "modern"
    }
  },
  styling: {
    colors: {
      primary: "bg-primary",
      secondary: "bg-accent",
      muted: "text-muted-foreground",
      background: "bg-background"
    },
    typography: {
      hero: "text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight",
      section: "text-3xl font-bold",
      subsection: "text-xl font-semibold",
      body: "text-base text-muted-foreground",
      small: "text-sm"
    },
    spacing: {
      section: "py-16 px-4 sm:px-6 lg:px-8",
      container: "max-w-5xl mx-auto",
      gap: "gap-8"
    }
  }
};

const generateImagePlacements = (images: string[], layout: any) => {
  const placements = {
    hero: [],
    features: [],
    valueProposition: [],
    testimonials: [],
    cta: []
  };

  // Distribute images across sections based on layout type
  let imageIndex = 0;
  const sections = Object.keys(layout.structure);
  
  for (const section of sections) {
    const sectionLayout = layout.structure[section];
    const imagesNeeded = sectionLayout.type === "grid" ? sectionLayout.columns : 1;
    
    for (let i = 0; i < imagesNeeded; i++) {
      if (imageIndex < images.length) {
        placements[section].push({
          url: images[imageIndex],
          position: sectionLayout.imagePosition || "center",
          effect: sectionLayout.style || "modern"
        });
        imageIndex = (imageIndex + 1) % images.length;
      }
    }
  }

  return placements;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessIdea, targetAudience, audienceAnalysis, projectImages = [] } = await req.json();

    console.log('Received project data:', {
      businessIdea: JSON.stringify(businessIdea, null, 2),
      targetAudience: JSON.stringify(targetAudience, null, 2),
      audienceAnalysis: JSON.stringify(audienceAnalysis, null, 2),
      imageCount: projectImages.length
    });

    // Use our defined template
    const selectedLayout = landingPageTemplate;
    
    // Generate image placements based on our template
    const imagePlacements = generateImagePlacements(projectImages, selectedLayout);

    const prompt = `Generate a comprehensive and professional landing page content following our modern SaaS template structure. Return ONLY a valid JSON object with the following structure:

{
  "hero": {
    "title": "Write a powerful headline (10-12 words) that immediately grabs attention",
    "description": "Write a compelling 2-3 sentence description (60-80 words) that highlights the main value proposition",
    "ctaPrimary": "Write primary CTA (3-4 words)",
    "ctaSecondary": "Write secondary CTA (3-4 words)"
  },
  "features": {
    "title": "Write a section title about key features (5-7 words)",
    "description": "Write a brief section description (20-30 words)",
    "items": [
      {
        "title": "Write feature title (3-4 words)",
        "description": "Write feature description (15-20 words)",
        "icon": "Suggest an icon name from Lucide Icons"
      }
    ]
  },
  "valueProposition": {
    "title": "Write a section title about your solution's value (5-7 words)",
    "items": [
      {
        "title": "Write value point title (3-4 words)",
        "description": "Write value point description (15-20 words)",
        "icon": "Suggest an icon name from Lucide Icons"
      }
    ]
  },
  "painPoints": {
    "title": "Write a section title addressing pain points (5-7 words)",
    "items": [
      {
        "title": "Write pain point title (3-4 words)",
        "description": "Write pain point solution (15-20 words)",
        "icon": "Suggest an icon name from Lucide Icons"
      }
    ]
  },
  "testimonials": {
    "title": "Write a social proof section title (5-7 words)",
    "items": [
      {
        "quote": "Write a testimonial (40-50 words)",
        "author": "Create a realistic name",
        "role": "Create a relevant job title"
      }
    ]
  },
  "faq": {
    "title": "Write an FAQ section title (4-5 words)",
    "items": [
      {
        "question": "Write a relevant question (8-12 words)",
        "answer": "Write a clear answer (30-40 words)"
      }
    ]
  },
  "cta": {
    "title": "Write a compelling final CTA (8-10 words)",
    "description": "Write a final pitch (30-40 words)",
    "buttonText": "Write action text (2-3 words)"
  }
}

Use this business information to create professional, conversion-focused content:

Business Details:
- Value Proposition: ${businessIdea?.valueProposition || 'Not specified'}
- Description: ${businessIdea?.description || 'Not specified'}

Target Audience:
- Description: ${targetAudience?.description || 'Not specified'}
- Demographics: ${targetAudience?.demographics || 'Not specified'}
- Pain Points: ${JSON.stringify(targetAudience?.painPoints || [])}
- Core Message: ${targetAudience?.coreMessage || 'Not specified'}

Market Analysis:
- Market Desire: ${audienceAnalysis?.marketDesire || 'Not specified'}
- Awareness Level: ${audienceAnalysis?.awarenessLevel || 'Not specified'}
- Deep Pain Points: ${JSON.stringify(audienceAnalysis?.deepPainPoints || [])}

Content Guidelines:
1. Use modern, professional language
2. Focus on benefits and transformations
3. Include specific, measurable outcomes
4. Address pain points directly
5. Maintain consistent tone and voice
6. Use action-oriented language
7. Keep it concise and impactful
8. Focus on the target audience's needs
9. Use social proof effectively
10. Create urgency without being pushy`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert landing page copywriter specializing in modern SaaS websites. Return ONLY valid JSON without any markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data, null, 2));
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    let landingPageContent = data.choices[0].message.content;
    console.log('Raw landing page content:', landingPageContent);

    // Clean the response
    landingPageContent = landingPageContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    console.log('Cleaned landing page content:', landingPageContent);

    try {
      const parsedContent = JSON.parse(landingPageContent);
      console.log('Parsed content:', JSON.stringify(parsedContent, null, 2));

      // Validate the content structure
      if (!parsedContent.hero || !parsedContent.features || !parsedContent.valueProposition) {
        throw new Error('Missing required sections in the response');
      }

      const finalContent = {
        ...parsedContent,
        layout: selectedLayout,
        imagePlacements,
        styling: selectedLayout.styling
      };

      return new Response(JSON.stringify(finalContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing landing page content:', parseError);
      console.error('Failed content:', landingPageContent);
      throw new Error(`Failed to parse landing page content: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in generate-landing-page function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate landing page content',
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
