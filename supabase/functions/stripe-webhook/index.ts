import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'stripe-signature, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function handleCreditsAllocation(
  supabase: any,
  userId: string,
  planData: any,
  sessionId: string,
  description: string
) {
  // First, log the payment
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      stripe_session_id: sessionId,
      amount: planData.credits, // Using credits as amount since it represents the value
      currency: 'credits',
      status: 'completed',
      description: description
    });

  if (paymentError) {
    console.error('Payment logging failed:', paymentError);
    throw paymentError;
  }

  // Check if user has an active subscription
  const { data: existingSubscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .single();

  if (subscriptionError && subscriptionError.code !== 'PGRST116') {
    console.error('Error checking subscription:', subscriptionError);
    throw subscriptionError;
  }

  if (existingSubscription) {
    // Update existing subscription
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        credits_remaining: existingSubscription.credits_remaining + planData.credits,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSubscription.id);

    if (updateError) {
      console.error('Subscription update failed:', updateError);
      throw updateError;
    }
  } else {
    // Create new subscription
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        credits_remaining: planData.credits,
        active: true,
        current_period_start: new Date().toISOString()
      });

    if (insertError) {
      console.error('Subscription creation failed:', insertError);
      throw insertError;
    }
  }

  // Log the credit operation
  const { error: operationError } = await supabase
    .from('credit_operations')
    .insert({
      user_id: userId,
      operation_type: 'credit_add',
      credits_amount: planData.credits,
      status: 'success'
    });

  if (operationError) {
    console.error('Credit operation logging failed:', operationError);
    throw operationError;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    console.log('Webhook request details:', {
      hasSignature: !!signature,
      bodyLength: body.length,
      bodyPreview: body.substring(0, 100)
    });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature || '',
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    );

    console.log('Event constructed:', {
      type: event.type,
      id: event.id
    });

    if (event.type === 'checkout.session.completed') {
      console.log('Processing checkout session event');
      
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabaseUid;
      
      if (!userId) {
        throw new Error('No user ID provided in session metadata');
      }

      console.log('Session details:', {
        id: session.id,
        metadata: session.metadata,
        customerId: session.customer,
        mode: session.mode
      });

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // Get price ID and plan
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product']
      });
      const priceId = lineItems.data[0].price?.id;

      if (!priceId) {
        throw new Error('No price found in session');
      }

      // Get plan details from database
      const { data: planData, error: planError } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('stripe_price_id', priceId)
        .single();

      if (planError || !planData) {
        console.error('Plan fetch error:', planError);
        throw new Error('Failed to fetch plan details');
      }

      const description = `Purchase of ${planData.name} plan - ${planData.credits} credits`;

      // Allocate credits using our transaction function
      await handleCreditsAllocation(
        supabaseAdmin,
        userId,
        planData,
        session.id,
        description
      );

      console.log('Successfully allocated credits for user:', userId);
    }

    return new Response(
      JSON.stringify({ received: true, type: event.type }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Webhook handler error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.name 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});