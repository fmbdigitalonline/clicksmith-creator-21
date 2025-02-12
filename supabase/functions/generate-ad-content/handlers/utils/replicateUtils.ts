
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
  sdxl: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  sdxlBase: "8beff3369e81422112d93b89ca01426147de542cd4684c244b673b105188fe5f",
  sdv15: "a4a8bafd6089e5dad6dd6dc5b3304a8ff88a27615fa0b67d135b0dfd814187be",
  flux: "black-forest-labs/flux-schnell"  // Updated to use the schnell model which is more reliable
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

// Function to scale dimensions while maintaining aspect ratio and max height of 1440
function getScaledDimensions(width: number, height: number): { width: number; height: number } {
  const MAX_HEIGHT = 1440;
  const MAX_WIDTH = 1440;
  
  if (height <= MAX_HEIGHT && width <= MAX_WIDTH) {
    return { width, height };
  }

  const aspectRatio = width / height;
  
  if (height > MAX_HEIGHT) {
    const newHeight = MAX_HEIGHT;
    const newWidth = Math.round(newHeight * aspectRatio);
    return { width: newWidth, height: newHeight };
  }
  
  if (width > MAX_WIDTH) {
    const newWidth = MAX_WIDTH;
    const newHeight = Math.round(newWidth / aspectRatio);
    return { width: newWidth, height: newHeight };
  }

  return { width, height };
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
    const apiKey = Deno.env.get('REPLICATE_API_KEY');
    if (!apiKey) {
      throw new Error('REPLICATE_API_KEY is not set in environment variables');
    }

    console.log('Starting image generation with configuration:', {
      prompt,
      model: config.model,
      options: config
    });

    const replicate = new Replicate({
      auth: apiKey,
    });

    // Scale dimensions to comply with API limitations
    const scaledDimensions = getScaledDimensions(config.width, config.height);
    console.log('Using scaled dimensions:', scaledDimensions);

    // Create prediction with retry logic
    const prediction = await retryWithBackoff(
      async () => {
        const modelId = MODELS[config.model as keyof typeof MODELS];
        console.log(`Using model: ${modelId}`);
        
        const result = await replicate.run(modelId, {
          input: {
            prompt,
            width: scaledDimensions.width,
            height: scaledDimensions.height,
            num_outputs: config.numOutputs,
            go_fast: true,
            megapixels: "1",
            aspect_ratio: `${scaledDimensions.width}:${scaledDimensions.height}`,
            output_format: "webp",
            output_quality: 80,
            num_inference_steps: 4
          }
        });

        console.log('Raw Replicate response:', result);
        return result;
      },
      {
        maxRetries: config.maxRetries,
        delay: config.retryDelay,
        backoffFactor: 2
      }
    );

    console.log('Prediction result:', prediction);

    // Handle different response formats
    let imageUrl: string;
    if (Array.isArray(prediction)) {
      imageUrl = prediction[0];
    } else if (typeof prediction === 'string') {
      imageUrl = prediction;
    } else if (prediction.output && Array.isArray(prediction.output)) {
      imageUrl = prediction.output[0];
    } else {
      throw new Error(`Unexpected response format from Replicate: ${JSON.stringify(prediction)}`);
    }
    
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
