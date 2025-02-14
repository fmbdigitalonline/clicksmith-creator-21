
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const layoutTemplates = [
  {
    id: "hero-centered",
    structure: {
      hero: { type: "centered", imagePosition: "background" },
      features: { type: "grid", columns: 3 },
      benefits: { type: "split", imagePosition: "right" },
      testimonials: { type: "carousel" }
    }
  },
  {
    id: "hero-split",
    structure: {
      hero: { type: "split", imagePosition: "right" },
      features: { type: "masonry" },
      benefits: { type: "grid", columns: 2 },
      testimonials: { type: "grid" }
    }
  },
  {
    id: "hero-fullscreen",
    structure: {
      hero: { type: "fullscreen", imagePosition: "overlay" },
      features: { type: "carousel" },
      benefits: { type: "alternating" },
      testimonials: { type: "centered" }
    }
  },
  {
    id: "minimal",
    structure: {
      hero: { type: "minimal", imagePosition: "floating" },
      features: { type: "list" },
      benefits: { type: "cards" },
      testimonials: { type: "slider" }
    }
  }
];

const generateImagePlacements = (images: string[], layout: any) => {
  const placements = {
    hero: [],
    features: [],
    benefits: [],
    testimonials: []
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
          effect: ["mockup", "floating", "shadow"][Math.floor(Math.random() * 3)]
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

    // Select a random layout template
    const selectedLayout = layoutTemplates[Math.floor(Math.random() * layoutTemplates.length)];
    
    // Generate image placements based on the selected layout
    const imagePlacements = generateImagePlacements(projectImages, selectedLayout);

    // Enhanced prompt for more professional and complete content
    const prompt = `Generate a comprehensive and professional landing page content. Use this layout structure: ${JSON.stringify(selectedLayout.structure)}. Return ONLY a valid JSON object with the following structure:

{
  "hero": {
    "title": "Write a powerful headline (10-15 words) that immediately grabs attention by addressing the main value proposition or solving a critical pain point. Make it action-oriented and benefit-focused.",
    "description": "Write a compelling 4-5 sentence description (80-120 words) that elaborates on the value proposition, addresses key pain points, and creates desire through concrete benefits. Use emotionally resonant language and specific details from the business description.",
    "cta": "Write a strong call-to-action button text (3-5 words) that creates urgency"
  },
  "features": [
    "Write 4-5 detailed feature descriptions (30-40 words each) that highlight the unique capabilities and technological advantages of the solution. Each feature should connect directly to a customer benefit or pain point solution."
  ],
  "benefits": [
    "Write 4-5 compelling benefit statements (30-40 words each) that focus on transformation and positive outcomes for the user. Include specific metrics, results, or improvements where possible."
  ],
  "painPoints": [
    "Write 3-4 specific pain point solutions (35-45 words each) that demonstrate deep understanding of user challenges and how your solution addresses them. Use real scenarios and concrete examples."
  ],
  "socialProof": {
    "testimonials": [
      {
        "content": "Write a detailed, results-focused testimonial (50-70 words) that highlights specific improvements or outcomes, using realistic scenarios and metrics",
        "name": "Create a realistic customer name that matches the target demographic",
        "role": "Add a relevant professional title and company type that aligns with the target audience"
      },
      {
        "content": "Write another unique testimonial (50-70 words) focusing on a different aspect of the solution's benefits",
        "name": "Create another realistic customer name",
        "role": "Add another relevant professional title and company type"
      }
    ]
  },
  "callToAction": {
    "title": "Write an urgent, benefit-focused headline (12-15 words) that motivates immediate action",
    "description": "Write a compelling final pitch (50-70 words) that summarizes the key value proposition and creates FOMO",
    "buttonText": "Write action-oriented button text (3-5 words)"
  }
}

Use this business information to create professional, conversion-focused content:

Business Details:
- Value Proposition: ${businessIdea?.valueProposition || 'Not specified'}
- Description: ${businessIdea?.description || 'Not specified'}

Target Audience Insights:
- Audience Description: ${targetAudience?.description || 'Not specified'}
- Demographics: ${targetAudience?.demographics || 'Not specified'}
- Pain Points: ${JSON.stringify(targetAudience?.painPoints || [])}
- Core Message: ${targetAudience?.coreMessage || 'Not specified'}

Market Analysis:
- Market Desire: ${audienceAnalysis?.marketDesire || 'Not specified'}
- Awareness Level: ${audienceAnalysis?.awarenessLevel || 'Not specified'}
- Deep Pain Points: ${JSON.stringify(audienceAnalysis?.deepPainPoints || [])}

Image Integration:
There are ${projectImages.length} project images available to showcase. Create content that naturally references and integrates with these visuals based on the selected layout structure.

Content Guidelines:
1. Generate substantial, detailed content for each section
2. Use specific numbers, statistics, or metrics where relevant
3. Include industry-relevant terminology
4. Address deep pain points directly
5. Focus on transformation and outcomes
6. Use action-oriented and emotionally engaging language
7. Maintain a professional, authoritative tone
8. Ensure all content aligns with the business's core value proposition
9. Write in a clear, engaging style that resonates with the target audience
10. Provide detailed, specific examples rather than generic statements

IMPORTANT: Write comprehensive, detailed content that naturally integrates with the provided images and layout structure. The total word count should be at least 800-1000 words spread across all sections.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4', // Fixed model name
        messages: [
          {
            role: 'system',
            content: 'You are an expert landing page copywriter specializing in creating comprehensive, professional content. You must return ONLY valid JSON without any markdown formatting or code blocks.',
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

    // Clean the response by removing any markdown or code block syntax
    landingPageContent = landingPageContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    console.log('Cleaned landing page content:', landingPageContent);

    // Parse and validate the response
    try {
      const parsedContent = JSON.parse(landingPageContent);
      console.log('Parsed content:', JSON.stringify(parsedContent, null, 2));

      // Validate the structure
      if (!parsedContent.hero || !parsedContent.features || !parsedContent.benefits) {
        throw new Error('Missing required sections in the response');
      }

      const finalContent = {
        ...parsedContent,
        layout: selectedLayout,
        imagePlacements
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
