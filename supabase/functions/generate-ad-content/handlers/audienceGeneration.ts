
import { corsHeaders } from "../../_shared/cors.ts";
import { BusinessIdea } from "../types.ts";

export async function generateAudiences(businessIdea: BusinessIdea, regenerationCount = 0, forceRegenerate = false, language = 'en') {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  console.log('Generating audiences with params:', { businessIdea, regenerationCount, forceRegenerate, language });

  let systemPrompt = 'You are an expert marketing strategist specializing in audience targeting and segmentation. Always respond with valid JSON array containing exactly 3 audience personas.';
  
  // Add language instructions to system prompt
  if (language !== 'en') {
    systemPrompt += ` Respond in ${language} language only. All text should be in ${language}, not in English.`;
  }

  const prompt = `Generate 3 distinct target audience personas for a business idea: ${businessIdea.description}.
  ${forceRegenerate ? `Make these different from previous generations (variation ${regenerationCount}).` : ''}
  
  For each persona, include:
  1. Demographics (age range, gender, location, income level)
  2. Psychographics (interests, values, lifestyle)
  3. Pain points and challenges
  4. Goals and aspirations
  5. Online behavior and platform preferences
  
  Format the response as a JSON array with 3 objects, each containing:
  {
    "name": "string",
    "description": "string",
    "demographics": "string",
    "painPoints": ["string"],
    "icp": "string",
    "coreMessage": "string",
    "positioning": "string",
    "marketingAngle": "string",
    "messagingApproach": "string",
    "marketingChannels": ["string"]
  }

  ${language !== 'en' ? `IMPORTANT: All the responses must be in ${language} language only, not in English.` : ''}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: forceRegenerate ? 0.9 : 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    const generatedText = data.choices[0].message.content;
    
    try {
      const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
      console.log('Cleaned text before parsing:', cleanedText);
      
      const parsedAudiences = JSON.parse(cleanedText);
      
      if (!Array.isArray(parsedAudiences) || parsedAudiences.length !== 3) {
        throw new Error('Generated content is not an array of 3 audiences');
      }

      parsedAudiences.forEach((audience, index) => {
        const requiredFields = [
          'name', 'description', 'demographics', 'painPoints',
          'icp', 'coreMessage', 'positioning', 'marketingAngle',
          'messagingApproach', 'marketingChannels'
        ];

        const missingFields = requiredFields.filter(field => !audience[field]);
        if (missingFields.length > 0) {
          throw new Error(`Audience ${index + 1} is missing required fields: ${missingFields.join(', ')}`);
        }

        if (!Array.isArray(audience.painPoints) || !Array.isArray(audience.marketingChannels)) {
          throw new Error(`Audience ${index + 1} has invalid array fields`);
        }
      });

      console.log('Successfully generated audiences:', parsedAudiences);
      return { audiences: parsedAudiences };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw response:', generatedText);
      throw new Error(`Failed to parse generated audiences: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in generateAudiences:', error);
    throw error;
  }
}
