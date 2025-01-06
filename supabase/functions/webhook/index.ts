import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret || '');
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log('Processing webhook event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const userId = session.metadata.supabaseUid;
        
        console.log('Processing completed checkout session:', {
          sessionId: session.id,
          customerId,
          userId,
          mode: session.mode
        });

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
          // Handle one-time payment
          const { error: subscriptionError } = await supabaseClient
            .from('subscriptions')
            .upsert({
              user_id: userId,
              plan_id: planData.id,
              stripe_customer_id: customerId,
              credits_remaining: planData.credits,
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              active: true,
            });

          if (subscriptionError) {
            console.error('Error updating subscription:', subscriptionError);
            throw subscriptionError;
          }

          console.log('Successfully processed one-time payment and updated credits');
        } else if (session.mode === 'subscription') {
          console.log('Processing subscription payment');
          // Handle subscription payment
          const subscriptionId = session.subscription;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          const { error: subscriptionError } = await supabaseClient
            .from('subscriptions')
            .upsert({
              user_id: userId,
              plan_id: planData.id,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: customerId,
              credits_remaining: planData.credits,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              active: true,
            });

          if (subscriptionError) {
            console.error('Error updating subscription:', subscriptionError);
            throw subscriptionError;
          }

          console.log('Successfully processed subscription payment and updated credits');
        }
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
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
});