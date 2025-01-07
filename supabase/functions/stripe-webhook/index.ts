import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Stripe } from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'stripe-signature, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

console.log('Starting webhook handler...');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log all headers for debugging
    console.log('All request headers:', Object.fromEntries(req.headers.entries()));

    const signature = req.headers.get('stripe-signature');
    console.log('Stripe signature present:', !!signature);
    if (signature) {
      console.log('Signature preview:', signature.substring(0, 50));
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    console.log('Webhook secret configured:', !!webhookSecret);
    if (webhookSecret) {
      console.log('Secret preview:', webhookSecret.substring(0, 10) + '...');
    }

    const body = await req.text();
    console.log('Request body length:', body.length);
    console.log('Body preview:', body.substring(0, 100));

    // Verify we have both required pieces
    if (!signature || !webhookSecret) {
      console.error('Missing required components:', {
        hasSignature: !!signature,
        hasSecret: !!webhookSecret
      });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required webhook components',
          details: {
            hasSignature: !!signature,
            hasSecret: !!webhookSecret
          }
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
      console.log('Successfully constructed event:', {
        type: event.type,
        id: event.id
      });
    } catch (err) {
      console.error('Signature verification failed:', {
        error: err.message,
        signatureLength: signature?.length,
        bodyLength: body.length,
        secretConfigured: !!webhookSecret
      });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid signature',
          details: err.message 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        received: true,
        type: event.type,
        id: event.id 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', {
      message: error.message,
      stack: error.stack
    });
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: 'webhook_processing_error'
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});