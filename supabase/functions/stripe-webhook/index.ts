import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@14.21.0';

// Basic headers required for the function to work
const baseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'stripe-signature, content-type',
  'Content-Type': 'application/json',
};

console.log('Webhook handler starting...');

serve(async (req: Request) => {
  console.log('Received request:', req.method)
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: baseHeaders })
  }

  try {
    // Get the raw body
    const rawBody = await req.text()
    console.log('Request body length:', rawBody.length)

    // Get Stripe signature
    const stripeSignature = req.headers.get('stripe-signature')
    console.log('Stripe signature present:', !!stripeSignature)

    if (!stripeSignature) {
      return new Response(
        JSON.stringify({ error: 'Stripe signature required' }), 
        { status: 400, headers: baseHeaders }
      )
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Get webhook secret
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    console.log('Webhook secret present:', !!webhookSecret)

    if (!webhookSecret) {
      console.error('Webhook secret not configured')
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }), 
        { status: 500, headers: baseHeaders }
      )
    }

    // Verify Stripe signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, stripeSignature, webhookSecret)
      console.log('Event verified:', event.type)
    } catch (err) {
      console.error('Stripe signature verification failed:', err.message)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }), 
        { status: 400, headers: baseHeaders }
      )
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          }
        }
      }
    );

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabaseUid;

      console.log('Processing checkout session:', session.id);

      if (!userId) {
        throw new Error('No user ID in session metadata');
      }

      // Create payment record
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          user_id: userId,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent as string,
          amount: session.amount_total,
          currency: session.currency,
          status: 'completed',
          customer_email: session.customer_details?.email
        });

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        throw paymentError;
      }

      // If this is a subscription (not one-time payment)
      if (session.mode === 'subscription') {
        console.log('Processing subscription payment');
        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0].price.id;

        // Get plan details from your database
        const { data: planData, error: planError } = await supabaseAdmin
          .from('plans')
          .select('*')
          .eq('stripe_price_id', priceId)
          .single();

        if (planError) {
          console.error('Error fetching plan:', planError);
          throw planError;
        }

        // Update or create subscription record
        const { error: subscriptionError } = await supabaseAdmin
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan_id: planData.id,
            stripe_customer_id: session.customer as string,
            credits_remaining: planData.credits,
            active: true,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          });

        if (subscriptionError) {
          console.error('Error updating subscription:', subscriptionError);
          throw subscriptionError;
        }
      } else if (session.mode === 'payment') {
        // Handle one-time payment
        const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
        console.log('Amount paid:', amountPaid);
        
        // Map payment amount to credits (10 EUR = 10 credits)
        const creditsToAdd = amountPaid === 10 ? 10 : 0;
        
        if (creditsToAdd > 0) {
          console.log('Adding credits to user:', userId, 'credits:', creditsToAdd);
          
          // First check if user has an active subscription
          const { data: existingSubscription, error: fetchError } = await supabaseAdmin
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
            const { error: updateError } = await supabaseAdmin
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
            const { error: insertError } = await supabaseAdmin
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
          const { error: logError } = await supabaseAdmin
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
      }

      console.log('✅ Successfully processed checkout session');
    }

    return new Response(
      JSON.stringify({ received: true }), 
      { status: 200, headers: baseHeaders }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: 'webhook_processing_error' 
      }), 
      { status: 500, headers: baseHeaders }
    );
  }
});
