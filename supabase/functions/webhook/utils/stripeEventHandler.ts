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
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Processing completed checkout session:', session.id);
      console.log('Payment mode:', session.mode);
      console.log('Payment status:', session.payment_status);
      
      if (session.mode === 'payment' && session.payment_status === 'paid') {
        // Handle one-time payment
        const userId = session.metadata?.supabaseUid;
        if (!userId) {
          throw new Error('No user ID found in session metadata');
        }

        // Get the amount paid and convert from cents to whole number
        const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
        console.log('Amount paid:', amountPaid);

        // Map payment amount to credits (10 EUR = 10 credits)
        const creditsToAdd = amountPaid === 10 ? 10 : 0;
        
        if (creditsToAdd > 0) {
          console.log('Adding credits to user:', userId, 'credits:', creditsToAdd);
          
          // First check if user has an active subscription
          const { data: existingSubscription, error: fetchError } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('active', true)
            .maybeSingle();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching subscription:', fetchError);
            throw fetchError;
          }

          if (existingSubscription) {
            // Update existing subscription
            const { error: updateError } = await supabaseClient
              .from('subscriptions')
              .update({
                credits_remaining: existingSubscription.credits_remaining + creditsToAdd,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingSubscription.id);

            if (updateError) {
              console.error('Error updating subscription:', updateError);
              throw updateError;
            }
          } else {
            // Create new subscription record
            const { error: insertError } = await supabaseClient
              .from('subscriptions')
              .insert({
                user_id: userId,
                credits_remaining: creditsToAdd,
                active: true,
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
              });

            if (insertError) {
              console.error('Error creating subscription:', insertError);
              throw insertError;
            }
          }

          // Log the credit operation
          const { error: logError } = await supabaseClient
            .from('credit_operations')
            .insert({
              user_id: userId,
              operation_type: 'add',
              credits_amount: creditsToAdd,
              status: 'success'
            });

          if (logError) {
            console.error('Error logging credit operation:', logError);
            // Don't throw here as credits were already added
          }
        }
      } else {
        // Handle subscription payment
        await handleCheckoutComplete(session, supabaseClient);
      }
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