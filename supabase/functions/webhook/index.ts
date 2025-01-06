import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { handleStripeEvent } from './utils/stripeEventHandler.ts';

// Most permissive CORS headers for webhook endpoint
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Allow-Headers': '*',
};

serve(async (req) => {
  console.log('=============== WEBHOOK REQUEST RECEIVED ===============');
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Get raw body before parsing
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);

    const signature = req.headers.get('stripe-signature');
    console.log('Stripe signature:', signature);

    let event;
    try {
      // Webhook secret should be exactly as configured in Stripe
      const webhookSecret = 'f8ba22f4bcbb8e72c2c51192276f19e233b192e350f9be5774131d24a845949f';
      event = stripe.webhooks.constructEvent(rawBody, signature || '', webhookSecret);
      console.log('Successfully constructed Stripe event:', event.type);
    } catch (err) {
      console.error('Failed to construct Stripe event:', err);
      return new Response(
        JSON.stringify({ 
          error: 'Webhook Error',
          details: err.message,
          receivedSignature: signature,
          receivedBody: rawBody.substring(0, 100) + '...' // Log first 100 chars for debugging
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('Creating Supabase client...');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing event:', event.type);
    console.log('Event data:', JSON.stringify(event.data, null, 2));

    await handleStripeEvent(event, stripe, supabaseClient);
    console.log('Event processed successfully');

    return new Response(
      JSON.stringify({ received: true, eventType: event.type }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Webhook handler error:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message,
        stack: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});