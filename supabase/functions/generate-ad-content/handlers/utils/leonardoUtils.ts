interface LeonardoResponse {
  sdGenerationJob: {
    generationId: string;
    status: string;
    imageUrls: string[];
  };
}

export async function generateWithLeonardo(prompt: string): Promise<string> {
  console.log('Starting image generation with Leonardo:', { prompt });

  // Validate prompt
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Invalid prompt provided to Leonardo API');
  }

  // Validate API key
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
        modelId: "1e7737d7-545e-469f-857f-e4b46eaa151d", // Leonardo Creative
        width: 1024,
        height: 1024,
        num_images: 1,
        guidance_scale: 7,
        public: false,
        promptMagic: true,
        negative_prompt: "low quality, blurry, distorted, ugly, bad anatomy, watermark, signature, text",
        nsfw: false,
        photoReal: true,
        seed: Math.floor(Math.random() * 2147483647), // Random seed for variety
        scheduler: "LEONARDO",
        presetStyle: "LEONARDO",
      }),
    });

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error('Leonardo API initialization error:', {
        status: initResponse.status,
        statusText: initResponse.statusText,
        error: errorText,
        requestBody: { prompt }
      });
      
      // Check for specific error cases
      if (initResponse.status === 401) {
        throw new Error('Invalid Leonardo API key. Please check your credentials.');
      } else if (initResponse.status === 400) {
        throw new Error('Invalid request parameters. Please check the prompt and model ID.');
      }
      
      throw new Error(`Leonardo API error: ${initResponse.status} ${initResponse.statusText}`);
    }

    const initData = await initResponse.json();
    
    if (!initData?.sdGenerationJob?.generationId) {
      console.error('Invalid response from Leonardo API:', initData);
      throw new Error('Invalid response format from Leonardo API');
    }

    const generationId = initData.sdGenerationJob.generationId;
    console.log('Generation initialized:', { generationId });

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
          error: errorText,
          generationId
        });
        throw new Error(`Failed to check generation status: ${statusResponse.status}`);
      }

      const statusData: LeonardoResponse = await statusResponse.json();
      console.log('Generation status:', {
        status: statusData.sdGenerationJob.status,
        generationId,
        attempt: attempts + 1
      });

      if (statusData.sdGenerationJob.status === 'COMPLETE') {
        if (!statusData.sdGenerationJob.imageUrls?.[0]) {
          throw new Error('No image URL in completed generation');
        }
        console.log('Leonardo generation complete:', {
          status: statusData.sdGenerationJob.status,
          imageCount: statusData.sdGenerationJob.imageUrls.length,
          generationId
        });
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