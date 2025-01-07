// Base headers for CORS and authorization
export const baseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Content-Type': 'application/json'
};

// Create a standardized error response with auth headers
export const createErrorResponse = (message: string, status: number) => {
  return new Response(
    JSON.stringify({ error: message }), 
    { 
      status, 
      headers: {
        ...baseHeaders,
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      }
    }
  );
};

// Create a standardized success response with auth headers
export const createSuccessResponse = (data: any) => {
  return new Response(
    JSON.stringify(data), 
    { 
      status: 200, 
      headers: {
        ...baseHeaders,
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      }
    }
  );
};