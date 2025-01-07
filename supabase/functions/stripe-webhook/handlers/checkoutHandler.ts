import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Stripe } from 'https://esm.sh/stripe@14.21.0';

export async function handleCheckoutSession(
  session: Stripe.Checkout.Session,
  supabaseAdmin: SupabaseClient
) {
  const userId = session.client_reference_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    throw new Error('No user ID found in session metadata');
  }

  console.log('Processing completed checkout for user:', userId);

  // Create payment record
  const { error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      user_id: userId,
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

  // If this is a subscription (not one-time payment)
  if (session.mode === 'subscription') {
    console.log('Processing subscription for user:', userId);
    
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0].price.id;

    // Get plan details from your database
    const { data: planData, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('stripe_price_id', priceId)
      .single();

    if (planError) {
      console.error('Error fetching plan:', planError);
      throw planError;
    }

    // Update or create subscription record
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_id: planData.id,
        stripe_customer_id: customerId,
        credits_remaining: planData.credits,
        active: true,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      });

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
      throw subscriptionError;
    }
    
    console.log('Successfully processed subscription update');
  } else if (session.mode === 'payment') {
    // Handle one-time payment
    console.log('Processing one-time payment for user:', userId);
    
    // Get the price ID from the line items
    const priceId = session.line_items?.data[0]?.price?.id;
    
    if (priceId) {
      // Get plan details from your database
      const { data: planData, error: planError } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('stripe_price_id', priceId)
        .single();

      if (planError) {
        console.error('Error fetching plan:', planError);
        throw planError;
      }

      // Update or create subscription record for one-time credits
      const { error: subscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_id: planData.id,
          stripe_customer_id: customerId,
          credits_remaining: planData.credits,
          active: true,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
        });

      if (subscriptionError) {
        console.error('Error updating subscription for one-time payment:', subscriptionError);
        throw subscriptionError;
      }
      
      console.log('Successfully processed one-time payment credits');
    }
  }

  console.log('✅ Successfully processed checkout session');
}