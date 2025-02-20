
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BLACK_FOREST_API_KEY = Deno.env.get('BLACK_FOREST_API_KEY');
const BLACK_FOREST_API_URL = "https://api.blackforest.pro/v1/image";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, negative_prompt, style, width, height } = await req.json();

    console.log('Generating image with Black Forest Pro:', {
      prompt,
      style,
      dimensions: `${width}x${height}`,
    });

    const response = await fetch(BLACK_FOREST_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BLACK_FOREST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        negative_prompt: negative_prompt || "",
        style: style || "1-1",
        width: width || 1024,
        height: height || 1024,
        num_images: 1,
        guidance_scale: 7.5,
        seed: -1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Black Forest API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Black Forest response:', data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-images function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
