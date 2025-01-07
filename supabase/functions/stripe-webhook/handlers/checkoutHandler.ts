import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Stripe } from 'https://esm.sh/stripe@14.21.0';

export async function handleCheckoutSession(
  session: Stripe.Checkout.Session,
  supabaseAdmin: ReturnType<typeof createClient>
) {
  console.log('Processing checkout session:', {
    id: session.id,
    mode: session.mode,
    userId: session.client_reference_id
  });

  if (!session.client_reference_id) {
    throw new Error('No user ID found in session');
  }

  const userId = session.client_reference_id;

  // Call the add_user_credits function with the correct parameter names
  const { data, error } = await supabaseAdmin.rpc('add_user_credits', {
    p_user_id: userId,
    p_credits: session.mode === 'payment' ? 10 : 30 // 10 credits for one-time payment, 30 for subscription
  });

  if (error) {
    console.error('Error adding credits:', error);
    throw error;
  }

  console.log('Credits added successfully:', data);
}