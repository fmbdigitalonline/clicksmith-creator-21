import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Stripe } from 'https://esm.sh/stripe@14.21.0';
import { baseHeaders, createErrorResponse, createSuccessResponse } from './utils.ts';
import { handleCheckoutSession } from './handlers/checkoutHandler.ts';

console.log('Webhook handler starting...');

serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: baseHeaders });
  }

  try {
    const rawBody = await req.text();
    const stripeSignature = req.headers.get('stripe-signature');
    
    console.log('Request received:', {
      method: req.method,
      contentType: req.headers.get('content-type'),
      hasStripeSignature: !!stripeSignature,
      bodyLength: rawBody.length
    });

    if (!stripeSignature) {
      console.error('Missing stripe-signature header');
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { 
          status: 400,
          headers: { ...baseHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { 
          status: 500,
          headers: { ...baseHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        stripeSignature,
        webhookSecret
      );
      console.log('Event verified successfully:', event.type);
    } catch (err) {
      console.error('Stripe signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Invalid stripe signature' }),
        { 
          status: 400,
          headers: { ...baseHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    );

    if (event.type === 'checkout.session.completed') {
      await handleCheckoutSession(event.data.object as Stripe.Checkout.Session, supabaseAdmin);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200,
        headers: { ...baseHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...baseHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});