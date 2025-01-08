import { Stripe } from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export async function handleCheckoutComplete(
  session: Stripe.Checkout.Session,
  supabaseClient: ReturnType<typeof createClient>
) {
  console.log('Processing completed checkout session:', session.id);
  
  const userId = session.metadata?.supabaseUid;
  if (!userId) {
    throw new Error('No user ID found in session metadata');
  }

  if (session.mode === 'subscription') {
    console.log('Processing subscription payment');
    const { error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
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

    if (existingSubscription) {
      const { error: updateError } = await supabaseClient
        .from('subscriptions')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        throw updateError;
      }
    }
  }
}