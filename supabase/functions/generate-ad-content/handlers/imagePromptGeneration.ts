export async function handleImagePromptGeneration(businessIdea: any, targetAudience: any, campaign: any, openAIApiKey: string) {
  const prompt = `Generate 6 different image prompts for Facebook ads based on the following information:

Business:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify(targetAudience, null, 2)}

Campaign:
${JSON.stringify(campaign, null, 2)}

Create prompts for both:
1. Positive scenes showing the solution
2. Problem-related scenes the audience can relate to

Style Instructions:
- Ultra-realistic, professional photography style
- Clean composition with space for text
- Vibrant, engaging colors
- Maximum 2 people per image
- Emotional impact
- High-end commercial look`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert at creating detailed prompts for AI image generation that align with marketing campaigns.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  const prompts = data.choices[0].message.content.split('\n').filter(Boolean);
  
  // Generate images using DALL-E
  const images = await Promise.all(
    prompts.slice(0, 6).map(async (prompt) => {
      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
        }),
      });

      const imageData = await imageResponse.json();
      if (imageData.error) {
        throw new Error(imageData.error.message);
      }

      return {
        url: imageData.data[0].url,
        prompt: prompt,
      };
    })
  );

  return { images };
}