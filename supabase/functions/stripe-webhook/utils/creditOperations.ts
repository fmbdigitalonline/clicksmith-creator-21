import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export async function addCreditsToUser(
  supabaseAdmin: SupabaseClient,
  userId: string,
  credits: number
) {
  console.log('Adding credits to user:', {
    userId,
    credits
  });

  // Create credit operation record
  const { error: creditOpError } = await supabaseAdmin
    .from('credit_operations')
    .insert({
      user_id: userId,
      operation_type: 'purchase',  // Changed from 'add' to 'purchase'
      credits_amount: credits,
      status: 'success'
    });

  if (creditOpError) {
    console.error('Failed to create credit operation:', creditOpError);
    throw creditOpError;
  }

  console.log('Credit operation created successfully');

  // Add credits to user's account
  const { data: creditsResult, error: creditsError } = await supabaseAdmin.rpc(
    'add_user_credits',
    {
      p_user_id: userId,
      p_credits: credits
    }
  );

  if (creditsError || !creditsResult?.success) {
    console.error('Failed to add credits:', {
      error: creditsError,
      result: creditsResult
    });
    throw new Error(creditsError?.message || creditsResult?.error_message || 'Failed to add credits');
  }

  console.log('Credits added successfully:', {
    userId,
    creditsAdded: credits,
    currentCredits: creditsResult.current_credits
  });

  return creditsResult;
}