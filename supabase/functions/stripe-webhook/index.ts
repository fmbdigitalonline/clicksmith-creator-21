import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json',
};

console.log('Webhook handler starting...');

serve(async (req) => {
  // Log the entire request for debugging
  console.log('Full request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: CORS_HEADERS,
      status: 200
    });
  }

  // For any request, just acknowledge receipt
  const body = await req.text();
  console.log('Received body:', body.substring(0, 100));

  return new Response(
    JSON.stringify({ received: true }), 
    { 
      status: 200, 
      headers: CORS_HEADERS
    }
  );
});