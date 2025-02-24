interface ContentGenerationParams {
  businessIdea: {
    description: string;
    valueProposition: string;
  };
  targetAudience: {
    name: string;
    description: string;
    painPoints: string[];
    coreMessage: string;
    marketingAngle: string;
  };
  projectImages?: string[];
  iterationNumber?: number;
}

export const generateLandingPageContent = async (
  businessIdea: ContentGenerationParams['businessIdea'], 
  targetAudience: ContentGenerationParams['targetAudience'],
  projectImages: string[] = []
) => {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OpenAI API key not found");

  console.log('Preparing landing page content generation with images:', projectImages);

  const imageContext = projectImages.length 
    ? `Use these image URLs in appropriate sections: ${projectImages.join(", ")}`
    : "No images provided, leave imageUrl fields empty";

  const prompt = `Generate landing page content and theme for a business with the following details:

Business Idea: ${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}
Target Audience: ${targetAudience.description}
Core Message: ${targetAudience.coreMessage}
Pain Points: ${targetAudience.painPoints.join(", ")}
Marketing Angle: ${targetAudience.marketingAngle}
${imageContext}

Create a complete landing page structure including theme settings in the following JSON structure:

{
  "sections": [
    {
      "type": "hero",
      "order": 1,
      "content": {
        "title": "compelling headline focusing on main value proposition",
        "subtitle": "persuasive description emphasizing benefits",
        "imageUrl": "first project image URL if available",
        "primaryCta": {
          "text": "action-oriented button text",
          "description": "motivation to click"
        }
      }
    }
  ],
  "theme": {
    "colorScheme": {
      "primary": "choose an appropriate color based on industry and emotion",
      "secondary": "complementary color",
      "accent": "highlight color for important elements",
      "background": "main background color",
      "text": "main text color",
      "muted": "color for less important text"
    },
    "typography": {
      "headingFont": "font family for headings",
      "bodyFont": "font family for body text",
      "scale": {
        "h1": "largest heading size",
        "h2": "second level heading size",
        "h3": "third level heading size",
        "body": "body text size",
        "small": "small text size"
      }
    },
    "spacing": {
      "sectionPadding": "padding between sections",
      "componentGap": "gap between components",
      "containerWidth": "max width for content"
    },
    "style": {
      "borderRadius": "rounded corners size",
      "shadowStrength": "none | light | medium | strong",
      "containerStyle": "contained | wide | full"
    }
  }
}

Make the content compelling and persuasive. Focus on addressing the pain points and using the specified marketing angle. Include bullet points and feature highlights. Theme should reflect the business type and target audience. Return ONLY valid JSON.`;

  try {
    console.log('Making request to OpenAI API...');
    
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
            content: "You are an expert copywriter and designer specializing in landing page content that converts. Return ONLY valid JSON matching the exact structure requested.",
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
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content generated");
    }

    // Clean up the content string
    const cleanContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Parse and enhance the content with project images
    const parsedContent = JSON.parse(cleanContent);
    
    // Inject project images if available
    if (projectImages.length > 0) {
      // Use first image for hero section
      if (parsedContent.sections[0]?.type === 'hero') {
        parsedContent.sections[0].content.imageUrl = projectImages[0];
      }
      
      // Distribute remaining images across feature sections
      const featuresSection = parsedContent.sections.find(s => s.type === 'features');
      if (featuresSection && featuresSection.content.items) {
        featuresSection.content.items.forEach((item, index) => {
          if (projectImages[index + 1]) {
            item.imageUrl = projectImages[index + 1];
          }
        });
      }
    }

    console.log('Content generated successfully');
    return parsedContent;
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};

// Export the functionality
export const deepeek = {
  generateLandingPageContent
};
