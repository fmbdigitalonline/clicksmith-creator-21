import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export const creditOperationLogger = async (
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  operationType: string,
  creditsAmount: number,
  errorMessage?: string
) => {
  console.log('Logging credit operation:', {
    userId,
    operationType,
    creditsAmount,
    errorMessage
  });

  const { error: logError } = await supabaseClient.rpc('log_credit_operation', {
    p_user_id: userId,
    p_operation_type: operationType,
    p_credits_amount: creditsAmount,
    p_status: errorMessage ? 'failed' : 'success',
    p_error_message: errorMessage || null
  });

  if (logError) {
    console.error('Error logging credit operation:', logError);
    // Don't throw here, as credits were already handled
    console.error('Credit operation logging failed but credits were processed');
  } else {
    console.log('Successfully logged credit operation');
  }
};