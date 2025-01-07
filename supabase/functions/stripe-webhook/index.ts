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
    
    console.log('Webhook request details:', {
      hasSignature: !!signature,
      bodyLength: body.length,
      bodyPreview: body.substring(0, 100)
    });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature || '',
        Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
      );
      console.log('Event constructed:', {
        type: event.type,
        id: event.id
      });
    } catch (err) {
      console.error('Webhook construction failed:', {
        error: err.message,
        signature: signature?.substring(0, 20),
        hasWebhookSecret: !!Deno.env.get('STRIPE_WEBHOOK_SECRET')
      });
      throw err;
    }

    if (event.type === 'checkout.session.completed') {
      console.log('Processing checkout session event');
      
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Session details:', {
        id: session.id,
        clientReferenceId: session.client_reference_id,
        customerId: session.customer,
        mode: session.mode
      });

      try {
        // Initialize Supabase
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
            user_id: session.client_reference_id,
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent as string,
            amount: session.amount_total,
            currency: session.currency,
            status: 'completed',
            customer_email: session.customer_details?.email
          });

        if (paymentError) {
          console.error('Payment record creation failed:', paymentError);
          throw paymentError;
        }

        console.log('Payment record created successfully');

        if (session.mode === 'subscription' && session.subscription) {
          console.log('Processing subscription details');
          
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = subscription.items.data[0].price.id;

          console.log('Subscription details:', {
            id: subscription.id,
            priceId: priceId,
            status: subscription.status
          });

          const { data: planData, error: planError } = await supabaseAdmin
            .from('plans')
            .select('*')
            .eq('stripe_price_id', priceId)
            .single();

          if (planError) {
            console.error('Plan fetch failed:', planError);
            throw planError;
          }

          const { error: subscriptionError } = await supabaseAdmin
            .from('subscriptions')
            .upsert({
              user_id: session.client_reference_id,
              plan_id: planData.id,
              stripe_customer_id: session.customer as string,
              credits_remaining: planData.credits,
              active: true,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
            });

          if (subscriptionError) {
            console.error('Subscription update failed:', subscriptionError);
            throw subscriptionError;
          }

          console.log('Subscription processed successfully');
        }
      } catch (err) {
        console.error('Database operation failed:', {
          error: err.message,
          code: err.code,
          details: err.details
        });
        throw err;
      }
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