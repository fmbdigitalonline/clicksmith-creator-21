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

          console.log('Plan details:', plan);
          const creditsToAdd = plan.credits;
          console.log('Credits to add:', creditsToAdd);

          // Call the allocate_credits function
          const { data: result, error: allocateError } = await supabaseClient.rpc(
            'allocate_credits',
            {
              p_user_id: userId,
              p_credits: creditsToAdd,
              p_payment_id: session.id,
              p_description: `Bundle purchase - ${creditsToAdd} credits`
            }
          );

          if (allocateError) {
            console.error('Error allocating credits:', allocateError);
            throw allocateError;
          }

          console.log('Credits allocated successfully:', result);
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