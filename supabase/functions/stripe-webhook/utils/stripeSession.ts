import { Stripe } from 'https://esm.sh/stripe@14.21.0';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export async function getPriceIdFromSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<string> {
  if (session.mode === 'subscription' && session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    return subscription.items.data[0].price.id;
  } 
  
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ['data.price']
  });
  const priceId = lineItems.data[0].price?.id;
  
  if (!priceId) {
    throw new Error('No price ID found');
  }
  
  return priceId;
}

export async function getPlanFromPriceId(
  supabaseAdmin: SupabaseClient,
  priceId: string
) {
  const { data: planData, error: planError } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('stripe_price_id', priceId)
    .single();

  if (planError) {
    console.error('Failed to fetch plan:', {
      error: planError,
      priceId: priceId
    });
    throw planError;
  }

  if (!planData) {
    throw new Error('No matching plan found');
  }

  return planData;
}