import { Stripe } from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export async function handleCheckoutComplete(
  session: Stripe.Checkout.Session,
  supabaseClient: ReturnType<typeof createClient>
) {
  console.log('Processing checkout completion for session:', session.id);

  const userId = session.metadata?.supabaseUid;
  if (!userId) {
    throw new Error('No user ID found in session metadata');
  }

  // Get the plan details
  const { data: plan, error: planError } = await supabaseClient
    .from('plans')
    .select('*')
    .eq('stripe_price_id', session.line_items?.data[0]?.price.id)
    .single();

  if (planError) {
    console.error('Error fetching plan:', planError);
    throw planError;
  }

  console.log('Plan details:', plan);

  // Call the allocate_credits function
  const { data: result, error: allocateError } = await supabaseClient.rpc(
    'allocate_credits',
    {
      p_user_id: userId,
      p_credits: plan.credits,
      p_payment_id: session.id,
      p_description: `Subscription to ${plan.name} - ${plan.credits} credits`
    }
  );

  if (allocateError) {
    console.error('Error allocating credits:', allocateError);
    throw allocateError;
  }

  console.log('Credits allocated successfully:', result);
  return result;
}