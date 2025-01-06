import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { handleSubscriptionPayment, handleOneTimePayment } from './utils/subscriptionHandler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
  });

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No Stripe signature found');
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    const body = await req.text();
    console.log('Received webhook body:', body);

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    console.log('Webhook event type:', event.type);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Processing completed checkout session:', session.id);

        // Get the customer details
        const customer = await stripe.customers.retrieve(session.customer as string);
        console.log('Customer details:', customer);

        // Get the price details
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0].price?.id;

        if (!priceId) {
          throw new Error('No price ID found in session');
        }

        // Get the plan details from our database
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
          throw new Error('No plan found for price ID: ' + priceId);
        }

        // Get the user ID from metadata
        const userId = session.metadata?.supabaseUid;
        if (!userId) {
          throw new Error('No user ID found in session metadata');
        }

        console.log('Processing payment for user:', userId, 'plan:', planData.name);

        // Handle the payment based on the mode
        if (session.mode === 'subscription') {
          await handleSubscriptionPayment(
            supabaseClient,
            userId,
            planData,
            session.customer as string,
            session.subscription as string
          );
        } else {
          await handleOneTimePayment(
            supabaseClient,
            userId,
            planData,
            session.customer as string
          );
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Processing subscription deletion:', subscription.id);

        // Get the customer details
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        console.log('Customer details:', customer);

        // Update subscription status in database
        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .update({ active: false })
          .eq('stripe_customer_id', subscription.customer)
          .eq('active', true);

        if (updateError) {
          console.error('Error updating subscription status:', updateError);
          throw updateError;
        }

        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

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