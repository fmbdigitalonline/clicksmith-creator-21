import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, businessIdea, targetAudience } = await req.json();
    console.log('Request received:', { type, businessIdea, targetAudience });

    let prompt = '';
    if (type === 'audience_analysis') {
      prompt = `Analyze the following target audience for a business:
      Business Description: ${businessIdea.description}
      Value Proposition: ${businessIdea.valueProposition}
      
      Target Audience:
      Name: ${targetAudience.name}
      Description: ${targetAudience.description}
      Demographics: ${targetAudience.demographics}
      Pain Points: ${targetAudience.painPoints.join(', ')}
      ICP: ${targetAudience.icp}
      Core Message: ${targetAudience.coreMessage}
      
      Provide a deep analysis following this structure:
      
      1. Expanded Definition:
      (Define potential group of people struggling with a problem who want to achieve a goal)
      
      2. Market Analysis:
      - Market Desire (deep desire from Breakthrough Advertising, not obvious product benefits)
      - Awareness Level (familiarity with problem/solution/product + actionable advertising approach)
      - Sophistication Level (familiarity with competing solutions + complexity of needs)
      
      3. Deep Pain Points (3 main problems)
      
      4. Potential Objections (3 main objections to buying)
      
      Return ONLY a valid JSON object with these fields:
      {
        "expandedDefinition": "string",
        "marketDesire": "string",
        "awarenessLevel": "string",
        "sophisticationLevel": "string",
        "deepPainPoints": ["string", "string", "string"],
        "potentialObjections": ["string", "string", "string"]
      }`;
    } else if (type === 'audience') {
      prompt = `Generate 3 distinct target audiences for the following business:
      Business Description: ${businessIdea.description}
      Value Proposition: ${businessIdea.valueProposition}

      For each audience, provide:
      1. Basic audience information
      2. Ideal Customer Profile (ICP)
      3. Core Message
      4. Positioning Strategy
      5. Marketing Angle
      6. Messaging Approach
      7. Core Marketing Channels

      Return ONLY a valid JSON array with exactly 3 audience objects, each containing these fields:
      - name (string): short, descriptive name
      - description (string): 2-3 sentences about the audience
      - painPoints (array of 3 strings): specific problems they face
      - demographics (string): age, income, location info
      - icp (string): detailed ideal customer profile
      - coreMessage (string): primary message that resonates with this audience
      - positioning (string): how the product should be positioned
      - marketingAngle (string): unique angle to approach this audience
      - messagingApproach (string): tone and style of communication
      - marketingChannels (array of strings): 2-3 most effective channels

      Format the response as a valid JSON array like this:
      [
        {
          "name": "Example Name",
          "description": "Example description",
          "painPoints": ["Point 1", "Point 2", "Point 3"],
          "demographics": "Example demographics",
          "icp": "Example ICP description",
          "coreMessage": "Example core message",
          "positioning": "Example positioning",
          "marketingAngle": "Example marketing angle",
          "messagingApproach": "Example messaging approach",
          "marketingChannels": ["Channel 1", "Channel 2"]
        }
      ]`;
    } else {
      prompt = `Create 3 compelling Facebook ad hooks for the following business:
      Business Description: ${businessIdea.description}
      Value Proposition: ${businessIdea.valueProposition}
      
      Each hook should be:
      1. Attention-grabbing
      2. Emotionally resonant with the target audience
      3. Focused on benefits and solutions
      4. Under 100 characters
      5. Include a clear call to action
      
      Format each hook on a new line, numbered 1-3.`;
    }

    console.log('Sending request to OpenAI with prompt:', prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: type === 'audience_analysis'
              ? 'You are an expert market researcher who provides deep audience analysis based on Eugene Schwartz\'s Breakthrough Advertising principles.'
              : type === 'audience'
              ? 'You are a JSON-focused market research analyst. Only return valid JSON arrays containing audience objects.'
              : 'You are an expert Facebook ad copywriter who creates compelling, conversion-focused ad hooks.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    console.log('OpenAI response:', data);
    
    if (data.error) {
      console.error('OpenAI API error:', data.error);
      throw new Error(data.error.message);
    }

    const generatedContent = data.choices[0].message.content;
    console.log('Generated content:', generatedContent);

    if (type === 'audience_analysis') {
      try {
        const cleanContent = generatedContent.trim();
        console.log('Attempting to parse JSON:', cleanContent);
        
        const analysis = JSON.parse(cleanContent);
        
        // Validate the analysis object has all required fields
        const requiredFields = ['expandedDefinition', 'marketDesire', 'awarenessLevel', 'sophisticationLevel', 'deepPainPoints', 'potentialObjections'];
        const missingFields = requiredFields.filter(field => !analysis[field]);
        
        if (missingFields.length > 0) {
          console.error('Analysis is missing required fields:', missingFields);
          throw new Error(`Analysis is missing required fields: ${missingFields.join(', ')}`);
        }

        if (!Array.isArray(analysis.deepPainPoints) || analysis.deepPainPoints.length !== 3) {
          throw new Error('Deep pain points must be an array of exactly 3 items');
        }

        if (!Array.isArray(analysis.potentialObjections) || analysis.potentialObjections.length !== 3) {
          throw new Error('Potential objections must be an array of exactly 3 items');
        }

        return new Response(
          JSON.stringify({ analysis }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error parsing analysis:', error, 'Raw content:', generatedContent);
        throw new Error(`Failed to parse generated analysis: ${error.message}`);
      }
    } else if (type === 'audience') {
      try {
        const cleanContent = generatedContent.trim();
        console.log('Attempting to parse JSON:', cleanContent);
        
        const audiences = JSON.parse(cleanContent);
        
        if (!Array.isArray(audiences) || audiences.length !== 3) {
          console.error('Invalid audience format:', audiences);
          throw new Error('Invalid audience format: expected array of 3 items');
        }

        // Validate each audience object has required fields
        audiences.forEach((audience, index) => {
          const requiredFields = ['name', 'description', 'painPoints', 'demographics', 'icp', 'coreMessage', 'positioning', 'marketingAngle', 'messagingApproach', 'marketingChannels'];
          const missingFields = requiredFields.filter(field => !audience[field]);
          
          if (missingFields.length > 0) {
            console.error(`Audience ${index} is missing required fields:`, missingFields);
            throw new Error(`Audience ${index} is missing required fields: ${missingFields.join(', ')}`);
          }
        });

        return new Response(
          JSON.stringify({ audiences }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error parsing audiences:', error, 'Raw content:', generatedContent);
        throw new Error(`Failed to parse generated audiences: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({ content: generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-ad-content function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
