import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { handleSubscriptionPayment, handleOneTimePayment } from './utils/subscriptionHandler.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Received webhook request');
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('No Stripe signature found');
    return new Response('No signature', { status: 401 });
  }

  try {
    const body = await req.text();
    console.log('Webhook raw body:', body);
    
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!endpointSecret) {
      console.error('No webhook secret found');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
      console.log('Successfully verified webhook signature');
      console.log('Event type:', event.type);
      console.log('Event data:', JSON.stringify(event.data, null, 2));
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const userId = session.metadata?.supabaseUid;
        
        console.log('Processing completed checkout session:', {
          sessionId: session.id,
          customerId,
          userId,
          mode: session.mode
        });

        if (!userId) {
          throw new Error('No user ID found in session metadata');
        }

        // Get price ID from the line items
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id;

        if (!priceId) {
          throw new Error('No price ID found in session');
        }

        console.log('Retrieved price ID:', priceId);

        // Get plan details from Supabase
        const { data: planData, error: planError } = await supabaseClient
          .from('plans')
          .select('*')
          .eq('stripe_price_id', priceId)
          .single();

        if (planError) {
          console.error('Error fetching plan:', planError);
          throw planError;
        }

        if (!planData) {
          console.error('Plan not found for price ID:', priceId);
          throw new Error('Plan not found');
        }

        console.log('Retrieved plan data:', planData);

        if (session.mode === 'payment') {
          console.log('Processing one-time payment');
          await handleOneTimePayment(supabaseClient, userId, planData, customerId);
        } else if (session.mode === 'subscription') {
          console.log('Processing subscription payment');
          const subscriptionId = session.subscription;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await handleSubscriptionPayment(supabaseClient, userId, planData, customerId, subscription);
        }

        console.log('Successfully processed payment');
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Deactivate subscription in Supabase
        const { error: deactivationError } = await supabaseClient
          .from('subscriptions')
          .update({ active: false })
          .eq('stripe_subscription_id', subscription.id);

        if (deactivationError) {
          console.error('Error deactivating subscription:', deactivationError);
          throw deactivationError;
        }

        console.log('Successfully deactivated subscription');
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});