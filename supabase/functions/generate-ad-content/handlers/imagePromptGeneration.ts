import { fal } from 'https://esm.sh/@fal-ai/client@1.2.1';

export async function handleImagePromptGeneration(businessIdea: any, targetAudience: any, campaign: any, openAIApiKey: string) {
  console.log('Starting image prompt generation...');
  
  const prompt = `Generate a Facebook ad image based on this business:
${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}

Target Audience:
${targetAudience.name}
${targetAudience.description}

Make it:
- Ultra-realistic, professional photography style
- Clean composition with space for text overlay
- Vibrant, engaging colors
- Maximum 2 people per image
- High-end commercial look
- Perfect for Facebook ads`;

  console.log('Generated prompt:', prompt);

  try {
    // Configure fal client with API key
    fal.config({
      credentials: Deno.env.get('FAL_KEY'),
    });

    // Generate 6 images in parallel
    const imagePromises = Array(6).fill(null).map(async () => {
      try {
        console.log('Generating image with prompt:', prompt);
        const result = await fal.subscribe("fal-ai/sana", {
          input: {
            prompt: prompt,
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              update.logs.map((log) => log.message).forEach(console.log);
            }
          },
        });

        console.log('Image generation result:', result);

        // Extract the image URL from the result
        const imageUrl = result.images?.[0]?.url;
        if (!imageUrl) {
          throw new Error('No image URL in response');
        }

        return { url: imageUrl, prompt };
      } catch (error) {
        console.error('Error generating individual image:', error);
        throw error;
      }
    });

    const images = await Promise.all(imagePromises);
    console.log(`Successfully generated ${images.length} images`);
    
    return { images };
  } catch (error) {
    console.error('Error in handleImagePromptGeneration:', error);
    throw error;
  }
}