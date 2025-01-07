import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Stripe } from 'https://esm.sh/stripe@14.21.0';
import { handleCheckoutSession } from './handlers/checkoutHandler.ts';

// Define headers explicitly for Stripe webhooks
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    console.log('Received webhook request');
    console.log('Signature:', signature);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Verify Stripe signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature || '',
        Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
      );
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }), 
        { status: 400, headers: CORS_HEADERS }
      );
    }

    console.log('Event verified:', event.type);

    // Initialize Supabase with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      console.log('Processing checkout.session.completed event');
      await handleCheckoutSession(event.data.object as Stripe.Checkout.Session, supabaseAdmin);
      console.log('Checkout session processed successfully');
    }

    return new Response(
      JSON.stringify({ received: true }), 
      { status: 200, headers: CORS_HEADERS }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 400, headers: CORS_HEADERS }
    );
  }
});