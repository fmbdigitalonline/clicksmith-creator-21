import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function handleImagePromptGeneration(businessIdea: any, targetAudience: any, campaign: any, openAIApiKey: string) {
  console.log('Starting image prompt generation...');
  
  const prompt = `Generate 6 different image prompts for Facebook ads based on this business:
${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}

Target Audience:
${targetAudience.name}
${targetAudience.description}

Create exactly 6 different prompts that would work well for Facebook ads:
- Make them ultra-realistic, professional photography style
- Clean composition with space for text overlay
- Vibrant, engaging colors
- Maximum 2 people per image
- High-end commercial look
- Perfect for Facebook ads`;

  console.log('Sending prompt to OpenAI:', prompt);

  try {
    // First generate the prompts using GPT
    const promptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an expert at creating detailed prompts for AI image generation that align with marketing campaigns. Return exactly 6 numbered prompts, one per line.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!promptResponse.ok) {
      const error = await promptResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const promptData = await promptResponse.json();
    console.log('OpenAI response:', promptData);

    // Extract exactly 6 prompts from the response
    const prompts = promptData.choices[0].message.content
      .split('\n')
      .filter(line => line.trim().match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, ''))
      .slice(0, 6);

    console.log('Generated prompts:', prompts);
    
    if (prompts.length !== 6) {
      throw new Error('Failed to generate exactly 6 prompts');
    }

    // Generate images using DALL-E with retry logic
    const maxRetries = 3;
    const images = await Promise.all(
      prompts.map(async (prompt) => {
        console.log('Generating image for prompt:', prompt);
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openAIApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: "dall-e-2",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                response_format: "url"
              }),
            });

            if (!imageResponse.ok) {
              const error = await imageResponse.text();
              console.error(`DALL-E API error (attempt ${attempt}/${maxRetries}):`, error);
              
              if (attempt === maxRetries) {
                throw new Error(`DALL-E API error after ${maxRetries} attempts: ${error}`);
              }
              
              // Wait before retrying, with exponential backoff
              await sleep(Math.pow(2, attempt) * 1000);
              continue;
            }

            const imageData = await imageResponse.json();
            console.log(`Successfully generated image on attempt ${attempt}`);
            return {
              url: imageData.data[0].url,
              prompt: prompt,
            };
          } catch (error) {
            if (attempt === maxRetries) {
              throw error;
            }
            console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);
            await sleep(Math.pow(2, attempt) * 1000);
          }
        }
      })
    );

    console.log(`Successfully generated ${images.length} images`);
    return { images };
  } catch (error) {
    console.error('Error in handleImagePromptGeneration:', error);
    throw error;
  }
}