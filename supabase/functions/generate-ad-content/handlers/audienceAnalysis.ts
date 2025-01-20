import { BusinessIdea, TargetAudience } from "../types.ts";

export const analyzeAudience = async (businessIdea: BusinessIdea, targetAudience: TargetAudience) => {
  console.log('Starting audience analysis with:', { businessIdea, targetAudience });
  
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Create an AbortController with a timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // Set to 8s to ensure we're under Supabase's 10s limit

  try {
    const prompt = `As an expert market researcher, analyze this target audience for a business:
    
    Business Description: ${businessIdea.description}
    Value Proposition: ${businessIdea.valueProposition}
    
    Target Audience:
    Name: ${targetAudience.name}
    Description: ${targetAudience.description}
    Demographics: ${targetAudience.demographics}
    Pain Points: ${targetAudience.painPoints.join(', ')}
    ICP: ${targetAudience.icp}
    Core Message: ${targetAudience.coreMessage}
    
    Provide a detailed analysis in JSON format with these exact fields:
    {
      "expandedDefinition": "A comprehensive description of who they are and their context",
      "marketDesire": "The deep underlying desire or need driving their behavior",
      "awarenessLevel": "Their current understanding of the problem and available solutions",
      "sophisticationLevel": "Their familiarity with and expectations for solutions",
      "deepPainPoints": ["Three specific, deep-rooted problems they face"],
      "potentialObjections": ["Three main objections they might have"]
    }`;

    console.log('Sending request to OpenAI with timeout control');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal, // Add abort signal
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert market researcher. Respond with valid JSON only, no markdown or additional text.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000, // Reduced from 2000 to help with timeout
        presence_penalty: 0.1, // Added to encourage faster responses
        frequency_penalty: 0.1, // Added to encourage faster responses
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    console.log('Raw OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    const content = data.choices[0].message.content;
    console.log('Content before parsing:', content);

    // Remove any potential markdown formatting
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    console.log('Cleaned content:', cleanContent);

    const analysis = JSON.parse(cleanContent);
    console.log('Parsed analysis:', analysis);

    // Validate the required fields
    const requiredFields = [
      'expandedDefinition',
      'marketDesire',
      'awarenessLevel',
      'sophisticationLevel',
      'deepPainPoints',
      'potentialObjections'
    ];

    for (const field of requiredFields) {
      if (!analysis[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(analysis.deepPainPoints) || !Array.isArray(analysis.potentialObjections)) {
      throw new Error('Pain points and objections must be arrays');
    }

    if (analysis.deepPainPoints.length !== 3 || analysis.potentialObjections.length !== 3) {
      throw new Error('Both deepPainPoints and potentialObjections must contain exactly 3 items');
    }

    return { analysis };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Request timed out after 8 seconds');
      throw new Error('Analysis generation timed out. Please try again.');
    }
    console.error('Error in analyzeAudience:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};