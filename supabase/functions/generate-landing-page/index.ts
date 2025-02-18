
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import Replicate from "https://esm.sh/replicate@0.25.2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface BusinessIdea {
  description?: string;
  valueProposition?: string;
}

interface TargetAudience {
  description?: string;
  coreMessage?: string;
  messagingApproach?: string;
  painPoints?: string[];
  benefits?: string[];
}

interface RequestBody {
  projectId: string;
  businessName: string;
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  userId: string;
}

const extractJsonFromResponse = (text: string) => {
  try {
    if (!text) {
      console.error('Empty response received');
      throw new Error('Empty response received');
    }

    let jsonStr = text;

    // If the response is a string containing JSON, extract it
    if (typeof text === 'string') {
      // Remove any potential leading/trailing whitespace
      jsonStr = text.trim();
      
      // Find the first occurrence of '{' and last occurrence of '}'
      const start = jsonStr.indexOf('{');
      const end = jsonStr.lastIndexOf('}') + 1;
      
      if (start === -1 || end === 0) {
        console.error('No JSON object found in response:', text);
        throw new Error('No JSON found in response');
      }
      
      // Extract the JSON string
      jsonStr = jsonStr.slice(start, end);
    }
    
    try {
      return JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Initial JSON parse error:', parseError);
      console.error('Problematic JSON string:', jsonStr);
      
      // Clean the JSON string
      const cleanedStr = jsonStr
        .replace(/(\w+)\s*:/g, '"$1":') // Add quotes to unquoted keys
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .replace(/,\s*[}\]]/g, '$1') // Remove trailing commas
        .replace(/:\s*'([^']*)'/g, ':"$1"') // Convert string values with single quotes to double quotes
        .replace(/\\([^"])/g, '$1'); // Remove unnecessary escape characters
      
      console.log('Attempting to parse cleaned JSON:', cleanedStr);
      return JSON.parse(cleanedStr);
    }
  } catch (error) {
    console.error('Error in extractJsonFromResponse:', error);
    console.error('Original text:', text);
    throw new Error('Failed to parse AI response');
  }
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let requestBody;
    try {
      const text = await req.text();
      console.log('Raw request body:', text);
      requestBody = JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      throw new Error('Invalid request body');
    }

    console.log('Parsed request body:', requestBody);
    const { projectId, businessName, businessIdea, targetAudience, userId } = requestBody as RequestBody;

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Generate theme
    const themePrompt = `Create a professional and modern theme with colors and fonts for: ${businessIdea?.description}. Target audience: ${targetAudience?.description}. Return only valid JSON.`;

    console.log('Sending theme prompt:', themePrompt);

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get('DEEPSEEK_API_KEY')}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: themePrompt }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const themeData = await response.json();
    console.log('Theme API raw response:', themeData);
    
    let theme;
    try {
      theme = extractJsonFromResponse(themeData.choices[0].message.content);
      console.log('Parsed theme:', theme);
    } catch (error) {
      console.error('Error parsing theme:', error);
      throw new Error('Failed to parse theme data');
    }

    // Generate hero image
    const replicate = new Replicate({
      auth: Deno.env.get('REPLICATE_API_TOKEN') || '',
    });

    const imagePrompt = `Professional hero image for ${businessName}. Business: ${businessIdea?.description}. Style: Modern, minimalist.`;
    console.log('Image generation prompt:', imagePrompt);
    
    const heroImage = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: {
          prompt: imagePrompt,
          num_outputs: 1,
          aspect_ratio: "16:9",
          output_format: "webp",
          output_quality: 95
        }
      }
    );

    console.log('Generated hero image:', heroImage);

    // Generate content
    const contentPrompt = `Create landing page content for ${businessName}. Business: ${businessIdea?.description}. Value Proposition: ${businessIdea?.valueProposition}. Return only valid JSON.`;
    
    console.log('Sending content prompt:', contentPrompt);

    const contentResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get('DEEPSEEK_API_KEY')}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: contentPrompt }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error('DeepSeek API content error:', contentResponse.status, errorText);
      throw new Error(`DeepSeek API content error: ${contentResponse.status}`);
    }

    const contentData = await contentResponse.json();
    console.log('Content API raw response:', contentData);
    
    let content;
    try {
      content = extractJsonFromResponse(contentData.choices[0].message.content);
      console.log('Parsed content:', content);
    } catch (error) {
      console.error('Error parsing content:', error);
      throw new Error('Failed to parse content data');
    }

    // Combine everything
    const landingPageContent = {
      hero: {
        title: content.hero?.title || "Welcome",
        description: content.hero?.description || "",
        cta: content.hero?.cta || "Get Started",
        image: Array.isArray(heroImage) && heroImage.length > 0 ? heroImage[0] : heroImage
      },
      valueProposition: content.valueProposition || {
        title: "Value Proposition",
        description: businessIdea?.valueProposition || "",
        cards: []
      },
      features: content.features || {
        title: "Features",
        description: "",
        items: []
      },
      styling: theme
    };

    console.log('Final landing page content:', landingPageContent);

    // Save to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const { error: updateError } = await supabase
      .from('landing_pages')
      .upsert({
        project_id: projectId,
        user_id: userId,
        title: businessName,
        content: landingPageContent,
        styling: theme,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('Error updating landing page:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify(landingPageContent),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in generate-landing-page:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})
