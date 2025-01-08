import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export const creditOperationLogger = async (
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  operationType: 'purchase' | 'deduct',
  creditsAmount: number,
  errorMessage?: string
) => {
  try {
    const { error } = await supabaseClient
      .from('credit_operations')
      .insert({
        user_id: userId,
        operation_type: operationType,
        credits_amount: creditsAmount,
        status: errorMessage ? 'failed' : 'success',
        error_message: errorMessage
      });

    if (error) {
      console.error('Error logging credit operation:', error);
      throw error;
    }

    console.log('Successfully logged credit operation:', {
      userId,
      operationType,
      creditsAmount,
      status: errorMessage ? 'failed' : 'success'
    });
  } catch (error) {
    console.error('Failed to log credit operation:', error);
    // We don't throw here to prevent breaking the main flow
  }
};