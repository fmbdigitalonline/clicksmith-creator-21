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
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    console.log('Request details:', {
      hasSignature: !!signature,
      bodyLength: body.length
    });

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }), 
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
      // Use constructEventAsync instead of constructEvent
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature || '',
        webhookSecret
      );
      console.log('Successfully verified event:', {
        type: event.type,
        id: event.id
      });
    } catch (err) {
      console.error('Signature verification failed:', err.message);
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

    // Log the event type we received
    console.log('Processing event type:', event.type);

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
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});