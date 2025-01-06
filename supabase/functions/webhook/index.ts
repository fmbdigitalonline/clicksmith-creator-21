import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the stripe signature from headers
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      console.error('No stripe signature found in headers')
      return new Response(
        JSON.stringify({ error: 'No stripe signature found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Get the raw body
    const body = await req.text()
    console.log('Received webhook payload:', body.substring(0, 100) + '...') // Log first 100 chars for debugging

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Verify the webhook signature
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('Webhook secret not configured in environment')
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      )
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed:`, err.message)
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log(`✅ Successfully verified webhook signature for event: ${event.type}`)

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string

      if (!userId) {
        throw new Error('No user ID found in session metadata')
      }

      console.log('Processing completed checkout for user:', userId)

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
        })

      if (paymentError) {
        console.error('Error creating payment record:', paymentError)
        throw paymentError
      }

      // If this is a subscription (not one-time payment)
      if (session.mode === 'subscription') {
        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0].price.id

        // Get plan details from your database
        const { data: planData, error: planError } = await supabaseAdmin
          .from('plans')
          .select('*')
          .eq('stripe_price_id', priceId)
          .single()

        if (planError) {
          console.error('Error fetching plan:', planError)
          throw planError
        }

        // Update or create subscription record
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
          })

        if (subscriptionError) {
          console.error('Error updating subscription:', subscriptionError)
          throw subscriptionError
        }
      }

      console.log('✅ Successfully processed checkout session')
    } else {
      console.log(`⚠️ Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Webhook error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})