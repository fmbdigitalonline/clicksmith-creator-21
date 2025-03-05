
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }
  
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorReason = url.searchParams.get('error_reason');
    const errorDescription = url.searchParams.get('error_description');
    
    // Handle error case
    if (error) {
      const redirectUrl = new URL('/facebook-callback', url.origin);
      redirectUrl.searchParams.set('success', 'false');
      redirectUrl.searchParams.set('error', error);
      redirectUrl.searchParams.set('error_reason', errorReason || '');
      redirectUrl.searchParams.set('error_description', errorDescription || '');
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl.toString()
        }
      });
    }
    
    // Handle successful auth
    if (code && state) {
      const redirectUrl = new URL('/facebook-callback', url.origin);
      redirectUrl.searchParams.set('success', 'true');
      redirectUrl.searchParams.set('code', code);
      redirectUrl.searchParams.set('state', state);
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl.toString()
        }
      });
    }
    
    // Default fallback
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request. Missing required parameters.' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  } catch (error) {
    console.error("Error in facebook-callback-handler:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
