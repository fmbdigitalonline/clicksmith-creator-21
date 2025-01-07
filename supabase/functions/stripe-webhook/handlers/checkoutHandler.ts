import { Stripe } from 'https://esm.sh/stripe@14.21.0';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export async function handleCheckoutSession(
  session: Stripe.Checkout.Session,
  supabaseAdmin: SupabaseClient
) {
  console.log('Processing checkout session:', {
    id: session.id,
    mode: session.mode,
    userId: session.client_reference_id
  });

  // Create payment record
  const { error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      user_id: session.client_reference_id,
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent as string,
      amount: session.amount_total,
      currency: session.currency,
      status: 'completed',
      customer_email: session.customer_details?.email
    });

  if (paymentError) {
    console.error('Error creating payment record:', paymentError);
    throw paymentError;
  }

  console.log('Payment record created successfully');

  // Handle subscription payment
  if (session.mode === 'subscription' && session.subscription) {
    console.log('Processing subscription payment');
    
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    const priceId = subscription.items.data[0].price.id;

    console.log('Subscription details:', {
      id: subscription.id,
      priceId: priceId,
      status: subscription.status
    });

    // Get plan details
    const { data: planData, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('stripe_price_id', priceId)
      .single();

    if (planError) {
      console.error('Error fetching plan:', planError);
      throw planError;
    }

    // Update subscription
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: session.client_reference_id,
        plan_id: planData.id,
        stripe_customer_id: session.customer as string,
        credits_remaining: planData.credits,
        active: true,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      });

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
      throw subscriptionError;
    }

    console.log('Subscription processed successfully');
  } else if (session.mode === 'payment') {
    // Handle one-time payment
    console.log('Processing one-time payment');

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get price ID from line items
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceId = lineItems.data[0].price?.id;

    if (!priceId) {
      throw new Error('No price ID found in line items');
    }

    // Get plan details
    const { data: planData, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('stripe_price_id', priceId)
      .single();

    if (planError) {
      console.error('Error fetching plan:', planError);
      throw planError;
    }

    // Create a one-time subscription with 1 year validity
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: session.client_reference_id,
        plan_id: planData.id,
        stripe_customer_id: session.customer as string,
        credits_remaining: planData.credits,
        active: true,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      });

    if (subscriptionError) {
      console.error('Error creating one-time subscription:', subscriptionError);
      throw subscriptionError;
    }

    console.log('One-time payment processed successfully');
  }
}