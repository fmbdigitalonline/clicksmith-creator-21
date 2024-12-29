const POLLING_INTERVAL = 2000; // 2 seconds
const MAX_POLLING_ATTEMPTS = 45; // 1.5 minutes maximum wait time
const MAX_RETRIES = 3;

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

  let retryCount = 0;
  
  while (retryCount < MAX_RETRIES) {
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
          modelId: "1e60896f-3c26-4296-8ecc-53e2afecc132", // Leonardo Lightning XL model
          width: 512,
          height: 512,
          num_images: 1,
          negative_prompt: "blurry, low quality, distorted, deformed",
          public: false,
          nsfw: false,
          photoReal: true,
          photoRealVersion: "v2",
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

      // Poll for results with exponential backoff
      console.log('Polling for generation results...');
      let attempts = 0;
      let delay = POLLING_INTERVAL;

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
          console.log('Successfully generated image:', imageUrl);
          return imageUrl;
        } else if (statusData.status === 'FAILED') {
          throw new Error('Generation failed: ' + (statusData.error || 'Unknown error'));
        }

        // Implement exponential backoff with a maximum delay
        delay = Math.min(delay * 1.5, 10000); // Max 10 seconds between polls
        await new Promise(resolve => setTimeout(resolve, delay));
        attempts++;
      }

      throw new Error('Generation timed out - will retry');
    } catch (error) {
      console.error(`Attempt ${retryCount + 1} failed:`, error);
      retryCount++;
      
      if (retryCount >= MAX_RETRIES) {
        console.error('All retry attempts failed');
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  throw new Error('All generation attempts failed');
}