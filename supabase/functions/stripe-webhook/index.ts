import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { handleCheckoutSession } from './handlers/checkoutHandler.ts';
import { baseHeaders } from './utils.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        ...baseHeaders,
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      }
    });
  }

  try {
    // Get the raw request body
    const body = await req.text();
    console.log('Received webhook body:', body);

    // Get the Stripe signature from headers
    const signature = req.headers.get('stripe-signature');
    console.log('Received Stripe signature:', signature);

    if (!signature) {
      throw new Error('No Stripe signature found in request headers');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client with auth headers
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          }
        }
      }
    );

    // Verify the event
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Webhook secret is not configured');
    }

    console.log('Constructing Stripe event...');
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
    console.log('Event constructed successfully:', event.type);

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutSession(event.data.object, supabaseAdmin);
    }

    return new Response(
      JSON.stringify({ received: true }), 
      {
        headers: { 
          ...baseHeaders, 
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` 
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Webhook error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 
          ...baseHeaders, 
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` 
        },
        status: 400,
      }
    );
  }
});