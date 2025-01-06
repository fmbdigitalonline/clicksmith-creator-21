import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

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

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Webhook event type:', event.type);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Processing completed checkout session:', session.id);

        const userId = session.metadata?.supabaseUid;
        if (!userId) {
          throw new Error('No user ID found in session metadata');
        }

        // Get the price details from Stripe
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

        // Handle subscription vs one-time payment
        if (session.mode === 'subscription') {
          console.log('Processing subscription payment');
          const { error: subscriptionError } = await supabaseClient
            .from('subscriptions')
            .upsert({
              user_id: userId,
              plan_id: planData.id,
              stripe_subscription_id: session.subscription,
              stripe_customer_id: session.customer,
              credits_remaining: planData.credits,
              current_period_start: new Date(session.current_period_start * 1000).toISOString(),
              current_period_end: new Date(session.current_period_end * 1000).toISOString(),
              active: true,
            });

          if (subscriptionError) {
            console.error('Error updating subscription:', subscriptionError);
            throw subscriptionError;
          }
        } else {
          console.log('Processing one-time payment');
          // Check for existing subscription
          const { data: existingSubscription, error: fetchError } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('active', true)
            .maybeSingle();

          if (fetchError) {
            console.error('Error fetching existing subscription:', fetchError);
            throw fetchError;
          }

          const creditsToAdd = planData.credits;
          const currentCredits = existingSubscription?.credits_remaining || 0;
          const newCredits = currentCredits + creditsToAdd;

          if (existingSubscription) {
            const { error: updateError } = await supabaseClient
              .from('subscriptions')
              .update({
                credits_remaining: newCredits,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingSubscription.id);

            if (updateError) {
              console.error('Error updating subscription credits:', updateError);
              throw updateError;
            }
          } else {
            const { error: subscriptionError } = await supabaseClient
              .from('subscriptions')
              .insert({
                user_id: userId,
                plan_id: planData.id,
                stripe_customer_id: session.customer,
                credits_remaining: creditsToAdd,
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
                active: true,
              });

            if (subscriptionError) {
              console.error('Error creating subscription:', subscriptionError);
              throw subscriptionError;
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Processing subscription deletion:', subscription.id);

        // Update subscription status in database
        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .update({ active: false })
          .eq('stripe_subscription_id', subscription.id);

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