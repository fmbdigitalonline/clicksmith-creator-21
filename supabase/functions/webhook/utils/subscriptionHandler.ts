import { Stripe } from 'https://esm.sh/stripe@14.21.0';
import { SupabaseClient } from '@supabase/supabase-js';

export async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  supabaseClient: SupabaseClient
) {
  console.log('Processing subscription deletion:', subscription.id);

  const { error: updateError } = await supabaseClient
    .from('subscriptions')
    .update({ active: false })
    .eq('stripe_subscription_id', subscription.id);

  if (updateError) {
    console.error('Error updating subscription status:', updateError);
    throw updateError;
  }
}