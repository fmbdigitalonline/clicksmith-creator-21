import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Stripe } from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'stripe-signature, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

console.log('Starting webhook handler...');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    console.log('Request details:', {
      hasSignature: !!signature,
      bodyLength: body.length
    });

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature || '',
        webhookSecret
      );
      console.log('Successfully verified event:', {
        type: event.type,
        id: event.id
      });
    } catch (err) {
      console.error('Signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Invalid signature', details: err.message }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Only process checkout.session.completed events
    if (event.type === 'checkout.session.completed') {
      console.log('Processing checkout session completed event');
      
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (!userId) {
        throw new Error('No user ID found in session metadata');
      }

      // Initialize Supabase client
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

      // Handle subscription if this is a subscription payment
      if (session.mode === 'subscription') {
        console.log('Processing subscription payment');
        
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;

        // Get plan details
        const { data: planData, error: planError } = await supabaseAdmin
          .from('plans')
          .select('*')
          .eq('stripe_price_id', priceId)
          .single();

        if (planError) {
          console.error('Error fetching plan:', planError);
          throw planError;
        }

        // Update subscription
        const { error: subscriptionError } = await supabaseAdmin
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan_id: planData.id,
            stripe_customer_id: customerId,
            credits_remaining: planData.credits,
            active: true,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          });

        if (subscriptionError) {
          console.error('Error updating subscription:', subscriptionError);
          throw subscriptionError;
        }
        
        console.log('Successfully processed subscription payment');
      }

      console.log('Successfully processed checkout session');
    }

    return new Response(
      JSON.stringify({ 
        received: true,
        type: event.type,
        id: event.id 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});