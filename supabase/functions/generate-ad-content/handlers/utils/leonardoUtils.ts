interface LeonardoResponse {
  sdGenerationJob: {
    generationId: string;
    status: string;
    imageUrls: string[];
  };
}

export async function generateWithLeonardo(prompt: string): Promise<string> {
  console.log('Starting image generation with Leonardo:', { prompt });

  try {
    // Initialize generation
    const initResponse = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LEONARDO_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        modelId: "ac614f96-1082-45bf-be9d-757f2d31c174", // Leonardo Creative
        width: 1024,
        height: 1024,
        num_images: 1,
        promptMagic: true,
        negative_prompt: "low quality, blurry, distorted",
      }),
    });

    if (!initResponse.ok) {
      throw new Error(`Leonardo API error: ${initResponse.status} ${initResponse.statusText}`);
    }

    const initData = await initResponse.json();
    const generationId = initData.sdGenerationJob.generationId;

    // Poll for results
    const maxAttempts = 30;
    const pollingInterval = 2000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollingInterval));

      const statusResponse = await fetch(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          headers: {
            'Authorization': `Bearer ${Deno.env.get('LEONARDO_API_KEY')}`,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error(`Failed to check generation status: ${statusResponse.status}`);
      }

      const statusData: LeonardoResponse = await statusResponse.json();

      if (statusData.sdGenerationJob.status === 'COMPLETE') {
        console.log('Leonardo generation complete:', statusData);
        return statusData.sdGenerationJob.imageUrls[0];
      }

      attempts++;
    }

    throw new Error('Image generation timed out');
  } catch (error) {
    console.error('Error in Leonardo image generation:', error);
    throw error;
  }
}