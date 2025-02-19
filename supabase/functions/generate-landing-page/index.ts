
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const generateDetailedPrompt = (businessName: string, businessIdea: any, targetAudience: any) => {
  return `Act as an expert copywriter and landing page content strategist. Create highly detailed, persuasive content for a landing page. The content should be comprehensive and conversion-focused.

BUSINESS CONTEXT:
Business Name: "${businessName}"
Business Concept: ${businessIdea?.description}
Value Proposition: ${businessIdea?.valueProposition}
Target Audience Name: ${targetAudience?.name}
Target Demographics: ${targetAudience?.demographics}
Core Message: ${targetAudience?.coreMessage}
Pain Points: ${targetAudience?.painPoints?.join(', ')}
Marketing Angle: ${targetAudience?.marketingAngle}
Messaging Approach: ${targetAudience?.messagingApproach}

DETAILED REQUIREMENTS:
Generate a complete landing page content structure in JSON format with the following sections. Use persuasive, emotionally engaging language that speaks directly to the audience's pain points and desires.

{
  "hero": {
    "title": "Write a powerful, attention-grabbing headline that emphasizes the main value proposition",
    "description": "Create a compelling 2-3 sentence subtitle that elaborates on the value proposition and addresses key pain points",
    "cta": "Write an action-oriented button text",
    "image": "Describe an ideal hero image that represents success and resonates with ${targetAudience?.name}"
  },
  "value_proposition": {
    "title": "Create a benefit-focused section title",
    "description": "Write a persuasive paragraph about the unique benefits",
    "cards": [
      {
        "title": "Write benefit-focused card titles",
        "description": "Create detailed 2-3 sentence descriptions for each value proposition",
        "icon": "Suggest an appropriate emoji icon"
      }
      // Generate 3 cards total
    ]
  },
  "features": {
    "title": "Write a features section title that emphasizes solutions",
    "description": "Create a paragraph describing how the features solve specific problems",
    "items": [
      {
        "title": "Write feature titles that emphasize benefits",
        "description": "Create detailed 2-3 sentence descriptions for each feature, focusing on problem-solution",
        "icon": "Suggest an appropriate emoji icon"
      }
      // Generate 4-5 feature items
    ]
  },
  "proof": {
    "title": "Write a social proof section title",
    "description": "Create a paragraph about customer success stories",
    "items": [
      {
        "quote": "Write detailed, specific testimonial quotes that address pain points and solutions",
        "author": "Create realistic customer names",
        "role": "Add relevant job titles",
        "company": "Add company names"
      }
      // Generate 3-4 testimonials
    ]
  },
  "pricing": {
    "title": "Write a pricing section title that emphasizes value",
    "description": "Create a paragraph about pricing benefits",
    "items": [
      {
        "name": "Create tier names",
        "price": "Set appropriate price points",
        "features": ["List 6-8 detailed features per tier"]
      }
      // Generate 3 pricing tiers
    ]
  },
  "finalCta": {
    "title": "Write an urgent, compelling call to action headline",
    "description": "Create a persuasive paragraph that overcomes final objections",
    "buttonText": "Write action-oriented button text"
  },
  "footer": {
    "links": {
      "company": ["Add 4-5 company-related links"],
      "resources": ["Add 4-5 resource-related links"]
    },
    "copyright": "Add copyright text with business name"
  }
}

Make content detailed, specific, and highly relevant to target audience profile: ${targetAudience?.description}. Use their awareness level: ${targetAudience?.awarenessLevel} and sophistication level: ${targetAudience?.sophisticationLevel} to adjust messaging tone and complexity.

Address these key pain points in the copy:
${targetAudience?.painPoints?.map((point: string) => `- ${point}`).join('\n')}

And overcome these objections:
${targetAudience?.potentialObjections?.map((obj: string) => `- ${obj}`).join('\n')}

Return the response in valid JSON format exactly matching the structure shown above.`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { projectId, businessName, businessIdea, targetAudience } = await req.json()
    console.log('Received request payload:', { projectId, businessName, businessIdea, targetAudience })
    
    const prompt = generateDetailedPrompt(businessName, businessIdea, targetAudience)
    console.log('Generated prompt:', prompt)
    
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('DEEPSEEK_API_KEY')}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert landing page copywriter specializing in creating detailed, persuasive content that converts. Always return responses in perfect JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 8000,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      })
    });

    const data = await response.json()
    console.log('DeepSeek API response:', data)

    let content
    try {
      // Try to parse the AI response as JSON
      content = JSON.parse(data.choices[0].message.content.trim())
      console.log('Successfully parsed AI response as JSON:', content)
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e)
      console.log('Raw AI response:', data.choices[0].message.content)
      throw new Error('Failed to parse AI response')
    }

    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in edge function:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Error generating landing page content'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
