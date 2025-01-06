import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req: Request) => {
  console.log('Webhook request received')
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the raw request body
    const body = await req.text()
    console.log('Request body received:', body)

    // Initialize Stripe with the secret key
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse the event
    let event: Stripe.Event
    try {
      event = JSON.parse(body)
      console.log('Successfully parsed Stripe event:', event.type)
    } catch (err) {
      console.error('Error parsing webhook body:', err)
      return new Response(
        JSON.stringify({ error: 'Error parsing webhook body' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      )
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      console.log('Processing checkout.session.completed event')
      const session = event.data.object as Stripe.Checkout.Session
      console.log('Session data:', session)
      
      // Extract the Supabase user ID from metadata
      const supabaseUid = session.metadata?.supabaseUid
      
      if (!supabaseUid) {
        console.error('No Supabase UID found in session metadata')
        throw new Error('No Supabase UID found in session metadata')
      }

      // Update the user's profile payment status
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', supabaseUid)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        throw updateError
      }

      console.log('Successfully updated profile payment status')

      // Create a payment record
      const { error: insertError } = await supabaseAdmin
        .from('payments')
        .insert({
          user_id: supabaseUid,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent as string,
          amount: session.amount_total || 0,
          currency: session.currency || 'usd',
          status: session.payment_status || 'unknown',
          customer_email: session.customer_details?.email
        })

      if (insertError) {
        console.error('Error creating payment record:', insertError)
        throw insertError
      }

      console.log('Successfully created payment record')
    }

    // Return a success response
    return new Response(
      JSON.stringify({ received: true }), 
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(
      JSON.stringify({ 
        error: 'Webhook handler failed', 
        details: err.message 
      }), 
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    )
  }
})