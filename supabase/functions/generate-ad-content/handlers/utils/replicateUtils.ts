import Replicate from "https://esm.sh/replicate@0.25.1";

interface ImageOptions {
  width: number;
  height: number;
  model?: string;
  numOutputs?: number;
}

const MODELS = {
  sdxl: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  hunyuan: "tencent/hunyuan-video:847dfa8b01e739637fc76f480ede0c1d76408e1d694b830b5dfb8e547bf98405"
};

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pollPrediction(replicate: Replicate, prediction: any, maxAttempts = 30): Promise<any> {
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
    prediction = await replicate.predictions.get(prediction.id);
    attempts++;
  }
  throw new Error(`Prediction timed out after ${maxAttempts} attempts`);
}

export async function generateVideo(
  prompt: string,
  options: { width: number; height: number; duration?: number } = { width: 1024, height: 576 }
): Promise<string> {
  try {
    console.log('Starting video generation with configuration:', {
      prompt,
      options,
      model: MODELS.hunyuan
    });

    const replicateApiToken = Deno.env.get('REPLICATE_API_TOKEN');
    if (!replicateApiToken) {
      throw new Error('REPLICATE_API_TOKEN is not configured');
    }

    const replicate = new Replicate({
      auth: replicateApiToken,
    });

    console.log('Creating video prediction with params:', {
      prompt,
      num_frames: Math.min(((options.duration || 30) * 24), 300),
      width: options.width,
      height: options.height
    });

    const prediction = await replicate.predictions.create({
      version: MODELS.hunyuan,
      input: {
        prompt,
        num_frames: Math.min(((options.duration || 30) * 24), 300),
        width: options.width,
        height: options.height,
        guidance_scale: 7.5,
        num_inference_steps: 50,
      }
    });

    console.log('Video generation started:', prediction);

    const result = await pollPrediction(replicate, prediction);
    console.log('Video generation completed:', result);

    // Handle different response formats
    let videoUrl: string;
    if (Array.isArray(result.output)) {
      videoUrl = result.output[0];
    } else if (typeof result.output === 'string') {
      videoUrl = result.output;
    } else {
      throw new Error(`Unexpected response format: ${JSON.stringify(result)}`);
    }

    if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.startsWith('http')) {
      throw new Error(`Invalid video URL received: ${videoUrl}`);
    }

    console.log('Successfully generated video URL:', videoUrl);
    return videoUrl;

  } catch (error) {
    console.error('Error in generateVideo:', error);
    throw error;
  }
}

export async function generateWithReplicate(prompt: string, options: ImageOptions): Promise<string> {
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
