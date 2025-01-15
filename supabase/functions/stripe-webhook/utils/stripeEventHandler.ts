import { Stripe } from "https://esm.sh/stripe@12.0.0";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function handleStripeEvent(
  event: Stripe.Event,
  stripe: Stripe,
  supabaseAdmin: SupabaseClient
) {
  console.log('Processing event:', event.type);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Processing completed checkout session:', session.id);
      console.log('Payment status:', session.payment_status);
      
      if (session.payment_status === 'paid') {
        const userId = session.metadata?.supabaseUid;
        if (!userId) {
          console.error('No user ID found in session metadata');
          throw new Error('No user ID found in session metadata');
        }

        // Get the price ID from the line items
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id;
        
        if (!priceId) {
          console.error('No price ID found in line items');
          throw new Error('No price ID found in line items');
        }

        console.log('Fetching plan details for price ID:', priceId);
        
        // First get all matching plans to understand what we're dealing with
        const { data: plans, error: plansError } = await supabaseAdmin
          .from('plans')
          .select('*')
          .eq('stripe_price_id', priceId);

        if (plansError) {
          console.error('Error fetching plans:', plansError);
          throw plansError;
        }

        if (!plans || plans.length === 0) {
          console.error('No plan found for price ID:', priceId);
          throw new Error(`No plan found for price ID: ${priceId}`);
        }

        // Log if we found multiple plans (this shouldn't happen)
        if (plans.length > 1) {
          console.warn('Multiple plans found for price ID:', priceId, plans);
        }

        // Use the first plan
        const plan = plans[0];

        console.log('Plan details:', plan);
        console.log('Allocating credits:', {
          userId,
          credits: plan.credits,
          sessionId: session.id,
          description: `Purchase of ${plan.name}`
        });

        // Allocate credits to the user
        const { data: result, error: allocateError } = await supabaseAdmin.rpc(
          'allocate_credits',
          {
            p_user_id: userId,
            p_credits: plan.credits,
            p_payment_id: session.id,
            p_description: `Purchase of ${plan.name}`
          }
        );

        if (allocateError) {
          console.error('Error allocating credits:', allocateError);
          throw allocateError;
        }

        console.log('Credits allocated successfully:', result);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('Processing subscription deletion:', subscription.id);
      
      // Handle subscription deletion
      const { error } = await supabaseAdmin
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
      console.log(`Unhandled event type: ${event.type}`);
  }
}