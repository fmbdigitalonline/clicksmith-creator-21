import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { creditOperationLogger } from './creditOperationLogger.ts';

export const handleSubscriptionPayment = async (
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  planData: { credits: number },
  customerId: string,
  subscription: any
) => {
  console.log('Processing subscription payment for user:', userId);
  
  const { error: subscriptionError } = await supabaseClient
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan_id: planData.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      credits_remaining: planData.credits,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      active: true,
    });

  if (subscriptionError) {
    console.error('Error updating subscription:', subscriptionError);
    throw subscriptionError;
  }

  console.log('Successfully processed subscription payment');
};

export const handleOneTimePayment = async (
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  planData: { credits: number },
  customerId: string
) => {
  console.log('Processing one-time payment for user:', userId, 'credits:', planData.credits);

  // Check for existing subscription
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

  const creditsToAdd = planData.credits;
  const currentCredits = existingSubscription?.credits_remaining || 0;
  const newCredits = currentCredits + creditsToAdd;

  console.log('Credit calculation:', {
    creditsToAdd,
    currentCredits,
    newCredits,
    hasExistingSubscription: !!existingSubscription
  });

  if (existingSubscription) {
    // Update existing subscription with additional credits
    const { error: updateError } = await supabaseClient
      .from('subscriptions')
      .update({
        credits_remaining: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSubscription.id);

    if (updateError) {
      console.error('Error updating subscription credits:', updateError);
      throw updateError;
    }

    console.log('Successfully updated subscription credits to:', newCredits);
  } else {
    // Create new subscription entry
    const { error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planData.id,
        stripe_customer_id: customerId,
        credits_remaining: creditsToAdd,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        active: true,
      });

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      throw subscriptionError;
    }

    console.log('Successfully created new subscription with credits:', creditsToAdd);
  }

  // Log the credit operation
  await creditOperationLogger(supabaseClient, userId, 'add', creditsToAdd);
};