import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { handleStripeEvent } from './utils/stripeEventHandler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Webhook received request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });

  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    console.log('Stripe signature:', signature);

    // Use the known webhook secret directly
    const webhookSecret = 'f8ba22f4bcbb8e72c2c51192276f19e233b192e350f9be5774131d24a845949f';
    
    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      throw new Error('Webhook secret not configured');
    }
    console.log('Using webhook secret for verification');

    const body = await req.text();
    console.log('=== WEBHOOK REQUEST DEBUG INFO ===');
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);
    console.log('Stripe-Signature:', signature);
    console.log('Request Body (first 100 chars):', body.substring(0, 100));
    console.log('Full Request Body:', body);
    console.log('========================');

    let event;
    try {
      console.log('Attempting to construct Stripe event...');
      event = stripe.webhooks.constructEvent(
        body,
        signature || '',
        webhookSecret
      );
      console.log('Event successfully constructed:', event.type);
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed');
      console.error('Error details:', err.message);
      console.error('Signature received:', signature);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Processing Stripe event:', event.type);
    await handleStripeEvent(event, stripe, supabaseClient);
    console.log('Successfully processed Stripe event:', event.type);

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error.message);
    console.error('Full error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});