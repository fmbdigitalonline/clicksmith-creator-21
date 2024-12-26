import { BusinessIdea } from "../types.ts";
import { OpenAIStream } from "../handlers/utils/replicateUtils.ts";

export async function generateAudiences(
  businessIdea: BusinessIdea, 
  regenerationCount: number = 0,
  forceRegenerate: boolean = false
): Promise<{ audiences: any[] }> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  console.log('Generating audiences with regeneration count:', regenerationCount);
  console.log('Force regenerate:', forceRegenerate);

  const prompt = `Generate 3 distinct target audience personas for a business idea: ${businessIdea.description}.
  ${forceRegenerate ? `Make these different from previous generations (variation ${regenerationCount}).` : ''}
  
  For each persona, include:
  1. Demographics (age range, gender, location, income level)
  2. Psychographics (interests, values, lifestyle)
  3. Pain points and challenges
  4. Goals and aspirations
  5. Online behavior and platform preferences
  
  Format the response as a JSON array with 3 objects, each containing these fields.`;

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
            content: 'You are an expert marketing strategist specializing in audience targeting and segmentation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: forceRegenerate ? 0.9 : 0.7, // Increase variation when regenerating
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    try {
      const audiences = JSON.parse(generatedText);
      console.log('Successfully generated audiences:', audiences);
      return { audiences };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse generated audiences');
    }
  } catch (error) {
    console.error('Error in generateAudiences:', error);
    throw error;
  }
}