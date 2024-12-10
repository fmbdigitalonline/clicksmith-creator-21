export async function handleImagePromptGeneration(businessIdea: any, targetAudience: any, campaign: any, openAIApiKey: string) {
  const prompt = `Generate 10 different image prompts for an ad campaign based on the following information:

Business:
${JSON.stringify(businessIdea, null, 2)}

Target Audience:
${JSON.stringify(targetAudience, null, 2)}

Campaign:
${JSON.stringify(campaign, null, 2)}

Create prompts for both:
1. Positive scenes where the prospect can see themselves succeeding
2. Problem-related scenes the prospect can relate to

Style Instructions:
- Mix of ultra-realistic images and digital illustration (semi-realistic/comic style)
- Main subject should be positioned on a side, not center
- Clean, uncluttered composition with space for text
- Vivid colors
- Maximum 2 people per image
- Include "--ar 1:1" at the end of each prompt

Return ONLY a valid JSON object with these fields:
{
  "formats": [
    {
      "format": "Facebook Feed",
      "dimensions": {
        "width": 1080,
        "height": 1080
      },
      "imagePrompts": [
        {
          "name": "string (descriptive name)",
          "prompt": "string (complete image prompt)"
        }
      ]
    }
  ]
}`;

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
          content: 'You are an expert at creating detailed, effective prompts for AI image generation that align with marketing campaigns.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  const formats = JSON.parse(data.choices[0].message.content.trim());
  return formats;
}