import Replicate from "https://esm.sh/replicate@0.25.1";

interface ImageOptions {
  width: number;
  height: number;
  model?: string;
  numOutputs?: number;
  maxAttempts?: number;
  retryDelay?: number;
  maxRetries?: number;
}

interface RetryConfig {
  maxRetries: number;
  delay: number;
  backoffFactor: number;
}

// Default model configurations
const MODELS = {
  sdxl: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // SDXL
  sdxlBase: "8beff3369e81422112d93b89ca01426147de542cd4684c244b673b105188fe5f", // SDXL Base
  sdv15: "a4a8bafd6089e5dad6dd6dc5b3304a8ff88a27615fa0b67d135b0dfd814187be", // Stable Diffusion v1.5
  flux: "black-forest-labs/flux-1.1-pro-ultra:d0b10a6f5c60f89f9067548d1b0c69b5e4f9fd4a2ac7cb03aa29264d704d1aa8" // Flux model for realistic images
} as const;

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < config.maxRetries - 1) {
        const backoffTime = config.delay * Math.pow(config.backoffFactor, attempt);
        await delay(backoffTime);
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

async function pollPrediction(
  replicate: Replicate,
  predictionId: string,
  maxAttempts: number = 30
): Promise<any> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const result = await replicate.predictions.get(predictionId);
    console.log(`Polling attempt ${attempts + 1}, status: ${result.status}`);
    
    if (result.status === 'succeeded') {
      return result;
    }
    
    if (result.status === 'failed') {
      throw new Error(`Prediction failed: ${result.error}`);
    }
    
    if (result.status === 'canceled') {
      throw new Error('Prediction was canceled');
    }
    
    await delay(1000);
    attempts++;
  }
  
  throw new Error(`Prediction timed out after ${maxAttempts} attempts`);
}

export async function generateWithReplicate(
  prompt: string,
  options: ImageOptions = { width: 1024, height: 1024 }
): Promise<string> {
  const defaultOptions = {
    model: 'flux',
    numOutputs: 1,
    maxAttempts: 30,
    maxRetries: 3,
    retryDelay: 1000,
  };

  const config = { ...defaultOptions, ...options };
  
  try {
    console.log('Starting image generation with configuration:', {
      prompt,
      model: config.model,
      options: config
    });

    const replicate = new Replicate({
      auth: Deno.env.get('REPLICATE_API_KEY'),
    });

    // Create prediction with retry logic
    const prediction = await retryWithBackoff(
      async () => replicate.predictions.create({
        version: MODELS[config.model as keyof typeof MODELS] || MODELS.flux,
        input: {
          prompt,
          width: config.width,
          height: config.height,
          num_outputs: config.numOutputs,
          raw: true, // Enable raw mode for more realistic images
        },
      }),
      {
        maxRetries: config.maxRetries,
        delay: config.retryDelay,
        backoffFactor: 2
      }
    );

    console.log('Prediction created:', prediction);

    // Poll for results with automatic retries
    const result = await pollPrediction(replicate, prediction.id, config.maxAttempts);
    
    console.log('Final result:', result);

    if (!result.output || !Array.isArray(result.output) || result.output.length === 0) {
      throw new Error('Invalid or empty output received from Replicate');
    }

    const imageUrl = result.output[0];
    
    if (typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      throw new Error(`Invalid URL format received: ${imageUrl}`);
    }

    console.log('Successfully generated image URL:', imageUrl);
    return imageUrl;

  } catch (error) {
    console.error('Error in generateWithReplicate:', {
      message: error.message,
      stack: error.stack,
      prompt,
      options: config
    });
    throw error;
  }
}