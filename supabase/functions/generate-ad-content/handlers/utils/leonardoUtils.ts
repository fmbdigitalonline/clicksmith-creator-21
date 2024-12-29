interface LeonardoResponse {
  sdGenerationJob: {
    generationId: string;
    status: string;
    imageUrls: string[];
  };
}

export async function generateWithLeonardo(prompt: string): Promise<string> {
  console.log('Starting image generation with Leonardo:', { prompt });

  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Invalid prompt provided to Leonardo API');
  }

  const apiKey = Deno.env.get('LEONARDO_API_KEY');
  if (!apiKey) {
    throw new Error('LEONARDO_API_KEY is not configured');
  }

  try {
    // Initialize generation with proper error handling
    const initResponse = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        modelId: "ac614f96-1082-45bf-be9d-757f2d31c174", // Leonardo Creative
        width: 1024,
        height: 1024,
        num_images: 1,
        photoReal: true,
        photoRealVersion: "v2",
        promptMagic: true,
        negative_prompt: "low quality, blurry, distorted",
      }),
    });

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error('Leonardo API initialization error:', {
        status: initResponse.status,
        statusText: initResponse.statusText,
        error: errorText
      });
      throw new Error(`Leonardo API initialization error: ${initResponse.status} ${initResponse.statusText}`);
    }

    const initData = await initResponse.json();
    
    if (!initData?.sdGenerationJob?.generationId) {
      console.error('Invalid response from Leonardo API:', initData);
      throw new Error('Invalid response format from Leonardo API');
    }

    const generationId = initData.sdGenerationJob.generationId;

    // Poll for results with improved error handling
    const maxAttempts = 30;
    const pollingInterval = 2000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollingInterval));

      const statusResponse = await fetch(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Leonardo API status check error:', {
          status: statusResponse.status,
          statusText: statusResponse.statusText,
          error: errorText
        });
        throw new Error(`Failed to check generation status: ${statusResponse.status}`);
      }

      const statusData: LeonardoResponse = await statusResponse.json();

      if (statusData.sdGenerationJob.status === 'COMPLETE') {
        if (!statusData.sdGenerationJob.imageUrls?.[0]) {
          throw new Error('No image URL in completed generation');
        }
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