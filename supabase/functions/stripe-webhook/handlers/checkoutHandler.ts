import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Stripe } from 'https://esm.sh/stripe@14.21.0';

export async function handleCheckoutSession(
  session: Stripe.Checkout.Session,
  supabaseAdmin: ReturnType<typeof createClient>
) {
  const userId = session.metadata?.supabaseUid;
  console.log('Processing checkout session:', session.id);

  if (!userId) {
    throw new Error('No user ID in session metadata');
  }

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

  // If this is a subscription
  if (session.mode === 'subscription') {
    await handleSubscription(session, supabaseAdmin, userId);
  } else if (session.mode === 'payment') {
    await handleOneTimePayment(session, supabaseAdmin, userId);
  }
}

async function handleSubscription(
  session: Stripe.Checkout.Session,
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string
) {
  console.log('Processing subscription payment');
  
  // Update profile payment status
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ payment_status: 'paid' })
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating profile:', profileError);
    throw profileError;
  }

  // Update or create subscription record
  const { error: subscriptionError } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      active: true,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    });

  if (subscriptionError) {
    console.error('Error updating subscription:', subscriptionError);
    throw subscriptionError;
  }
}

async function handleOneTimePayment(
  session: Stripe.Checkout.Session,
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string
) {
  const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
  console.log('Processing one-time payment:', amountPaid);

  // Update profile payment status
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ payment_status: 'paid' })
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating profile:', profileError);
    throw profileError;
  }
}