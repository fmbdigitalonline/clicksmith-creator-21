import { Stripe } from 'https://esm.sh/stripe@14.21.0';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { handleSubscriptionChange } from './subscriptionHandler.ts';
import { handleCheckoutComplete } from './checkoutHandler.ts';

export async function handleStripeEvent(
  event: Stripe.Event,
  stripe: Stripe,
  supabaseClient: SupabaseClient
) {
  console.log('Processing event:', event.type);
  console.log('Event data:', JSON.stringify(event.data.object, null, 2));

  switch (event.type) {
    case 'checkout.session.completed': {
      await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session, supabaseClient);
      break;
    }
    case 'customer.subscription.deleted': {
      await handleSubscriptionChange(event.data.object as Stripe.Subscription, supabaseClient);
      break;
    }
    default:
      console.log('Unhandled event type:', event.type);
  }
}