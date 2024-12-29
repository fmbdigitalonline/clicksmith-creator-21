const POLLING_INTERVAL = 2000; // 2 seconds
const MAX_POLLING_ATTEMPTS = 30; // 1 minute maximum wait time

export async function generateWithLeonardo(prompt: string): Promise<string> {
  console.log('Starting image generation with Leonardo:', { prompt });

  // Validate prompt
  if (!prompt || typeof prompt !== 'string' || prompt.length < 10) {
    throw new Error('Invalid prompt: Prompt must be a string of at least 10 characters');
  }

  // Validate API key
  const apiKey = Deno.env.get('LEONARDO_API_KEY');
  if (!apiKey) {
    throw new Error('Leonardo API key not configured');
  }

  try {
    // Initialize generation
    console.log('Initializing Leonardo generation...');
    const initResponse = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        modelId: "b24e16ff-06e3-43eb-8d33-4416c2d75876", // Updated model ID
        width: 1024,
        height: 768,
        num_images: 1,
        negative_prompt: "",
        public: false,
        nsfw: false,
        photoReal: true,
        seed: Math.floor(Math.random() * 2147483647),
        scheduler: "DDIM",
        presetStyle: "DYNAMIC",
        alchemy: true,
        guidance_scale: 7,
        promptMagicVersion: "v2",
      }),
    });

    const initData = await initResponse.json();
    console.log('Leonardo init response:', initData);

    if (!initResponse.ok) {
      const errorText = initData.error || 'Unknown error';
      console.error('Leonardo API initialization error:', {
        status: initResponse.status,
        error: errorText,
      });

      if (initResponse.status === 401) {
        throw new Error('Invalid Leonardo API key. Please check your credentials.');
      } else if (initResponse.status === 400) {
        throw new Error(`Invalid request parameters: ${errorText}`);
      }
      
      throw new Error(`Leonardo API error: ${initResponse.status} ${initResponse.statusText}`);
    }

    const generationId = initData.sdGenerationJob?.generationId;
    if (!generationId) {
      throw new Error('No generation ID received from Leonardo API');
    }

    // Poll for results
    console.log('Polling for generation results...');
    let attempts = 0;
    while (attempts < MAX_POLLING_ATTEMPTS) {
      const statusResponse = await fetch(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          headers: {
            'authorization': `Bearer ${apiKey}`,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error(`Failed to check generation status: ${statusResponse.status} ${statusResponse.statusText}`);
      }

      const statusData = await statusResponse.json();
      console.log('Generation status:', statusData.status);

      if (statusData.status === 'COMPLETE') {
        const imageUrl = statusData.generations?.[0]?.url;
        if (!imageUrl) {
          throw new Error('No image URL in completed generation');
        }
        return imageUrl;
      } else if (statusData.status === 'FAILED') {
        throw new Error('Generation failed: ' + (statusData.error || 'Unknown error'));
      }

      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      attempts++;
    }

    throw new Error('Generation timed out');
  } catch (error) {
    console.error('Error in Leonardo image generation:', error);
    throw error;
  }
}