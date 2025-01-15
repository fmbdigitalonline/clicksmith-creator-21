import { Stripe } from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { handleCheckoutComplete } from './checkoutHandler.ts';

export async function handleStripeEvent(
  event: Stripe.Event,
  stripe: Stripe,
  supabaseClient: ReturnType<typeof createClient>
) {
  console.log('Processing event:', event.type);
  console.log('Event data:', JSON.stringify(event.data.object, null, 2));

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Processing completed checkout session:', session.id);
      console.log('Payment mode:', session.mode);
      console.log('Payment status:', session.payment_status);
      
      if (session.payment_status === 'paid') {
        const userId = session.metadata?.supabaseUid;
        if (!userId) {
          console.error('No user ID found in session metadata');
          throw new Error('No user ID found in session metadata');
        }

        if (session.mode === 'payment') {
          // Handle one-time payment (Bundle)
          console.log('Processing one-time payment');
          
          // Get the plan details to determine credits
          const { data: plan, error: planError } = await supabaseClient
            .from('plans')
            .select('credits')
            .eq('stripe_price_id', session.line_items?.data[0]?.price.id)
            .single();

          if (planError) {
            console.error('Error fetching plan:', planError);
            throw planError;
          }

          const creditsToAdd = plan.credits;
          console.log('Credits to add from plan:', creditsToAdd);
          
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
            console.log('Updating existing subscription for user:', userId);
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
            console.log('Creating new subscription for user:', userId);
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
              operation_type: 'credit_add',
              credits_amount: creditsToAdd,
              status: 'success'
            });

          if (logError) {
            console.error('Error logging credit operation:', logError);
            // Don't throw here as credits were already added
          }
        } else {
          // Handle subscription payment
          console.log('Handling subscription payment');
          await handleCheckoutComplete(session, supabaseClient);
        }
      }
      break;
    }
    case 'customer.subscription.deleted': {
      console.log('Processing subscription deletion');
      const subscription = event.data.object as Stripe.Subscription;
      // Handle subscription deletion
      const { error } = await supabaseClient
        .from('subscriptions')
        .update({ active: false })
        .eq('stripe_subscription_id', subscription.id);
      
      if (error) {
        console.error('Error updating subscription status:', error);
        throw error;
      }
      break;
    }
    default:
      console.log('Unhandled event type:', event.type);
  }
}