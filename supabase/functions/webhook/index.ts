import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { handleStripeEvent } from './utils/stripeEventHandler.ts';

// Basic CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Log incoming request details
  console.log('Webhook received:', {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    console.log('Stripe signature received:', signature);

    // Get the raw body as text
    const body = await req.text();
    console.log('Webhook body:', body);

    let event;
    try {
      // Use the known webhook secret
      const webhookSecret = 'f8ba22f4bcbb8e72c2c51192276f19e233b192e350f9be5774131d24a845949f';
      event = stripe.webhooks.constructEvent(body, signature || '', webhookSecret);
      console.log('Event constructed successfully:', event.type);
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      // Use service role key for admin operations
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing Stripe event:', event.type);
    await handleStripeEvent(event, stripe, supabaseClient);
    console.log('Successfully processed event:', event.type);

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Webhook error:', error.message);
    console.error('Full error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});