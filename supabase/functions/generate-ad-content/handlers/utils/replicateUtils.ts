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
  flux: "black-forest-labs/flux-1.1-pro",
  hunyuan: "tencent/hunyuan-video:847dfa8b01e739637fc76f480ede0c1d76408e1d694b830b5dfb8e547bf98405"
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
  prediction: any,
  maxAttempts: number = 30
): Promise<any> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    if (prediction.status === 'succeeded') {
      return prediction;
    }
    
    if (prediction.status === 'failed') {
      throw new Error(`Prediction failed: ${prediction.error}`);
    }
    
    if (prediction.status === 'canceled') {
      throw new Error('Prediction was canceled');
    }
    
    await delay(1000);
    attempts++;
  }
  
  throw new Error(`Prediction timed out after ${maxAttempts} attempts`);
}

export async function generateVideo(
  prompt: string,
  options: {
    width: number;
    height: number;
    duration?: number;
    maxRetries?: number;
    retryDelay?: number;
  } = { width: 1024, height: 576 }
): Promise<string> {
  const config = {
    maxRetries: options.maxRetries || 3,
    retryDelay: options.retryDelay || 1000,
  };

  try {
    console.log('Starting video generation with configuration:', {
      prompt,
      options
    });

    const replicate = new Replicate({
      auth: Deno.env.get('REPLICATE_API_TOKEN'),
    });

    // Create prediction with retry logic
    const prediction = await retryWithBackoff(
      async () => {
        console.log(`Using Hunyuan model for video generation`);
        
        const result = await replicate.run(MODELS.hunyuan, {
          input: {
            prompt,
            num_frames: Math.min(((options.duration || 30) * 24), 300), // 24fps, max 300 frames
            width: options.width,
            height: options.height,
            guidance_scale: 7.5,
            num_inference_steps: 50,
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

    console.log('Video generation result:', prediction);

    // Handle different response formats
    let videoUrl: string;
    if (Array.isArray(prediction)) {
      videoUrl = prediction[0];
    } else if (typeof prediction === 'string') {
      videoUrl = prediction;
    } else if (prediction.output && Array.isArray(prediction.output)) {
      videoUrl = prediction.output[0];
    } else {
      throw new Error(`Unexpected response format from Replicate: ${JSON.stringify(prediction)}`);
    }
    
    if (typeof videoUrl !== 'string' || !videoUrl.startsWith('http')) {
      throw new Error(`Invalid URL format received: ${videoUrl}`);
    }

    console.log('Successfully generated video URL:', videoUrl);
    return videoUrl;

  } catch (error) {
    console.error('Error in generateVideo:', {
      message: error.message,
      stack: error.stack,
      prompt,
      options
    });
    throw error;
  }
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
      async () => {
        const modelId = MODELS[config.model as keyof typeof MODELS];
        console.log(`Using model: ${modelId}`);
        
        const result = await replicate.run(modelId, {
          input: {
            prompt,
            width: config.width,
            height: config.height,
            num_outputs: config.numOutputs,
            prompt_upsampling: true,
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