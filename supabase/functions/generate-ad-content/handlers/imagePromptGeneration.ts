import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

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
    const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'))
    
    // Generate 6 images in parallel
    const imagePromises = Array(6).fill(null).map(async () => {
      try {
        console.log('Generating image with prompt:', prompt);
        const image = await hf.textToImage({
          inputs: prompt,
          model: 'black-forest-labs/FLUX.1-schnell',
        });

        // Convert blob to base64
        const arrayBuffer = await image.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const url = `data:image/png;base64,${base64}`;

        return { url, prompt };
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