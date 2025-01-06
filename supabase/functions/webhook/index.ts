import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { handleStripeEvent } from './utils/stripeEventHandler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('No Stripe signature found in request headers');
      throw new Error('No Stripe signature found');
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      throw new Error('Webhook secret not configured');
    }

    // Log important information for debugging
    const body = await req.text();
    console.log('=== WEBHOOK DEBUG INFO ===');
    console.log('Webhook Secret (first 10 chars):', webhookSecret.substring(0, 10));
    console.log('Stripe Signature:', signature);
    console.log('Request Body (first 100 chars):', body.substring(0, 100));
    console.log('========================');

    let event;
    try {
      console.log('Attempting to construct event with provided secret...');
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
      console.log('Event successfully constructed:', event.type);
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed with secret ${webhookSecret.substring(0, 10)}...`);
      console.error('Error details:', err.message);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    await handleStripeEvent(event, stripe, supabaseClient);

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});