import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0";

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
    });

    let event;
    try {
      event = await stripe.webhooks.constructEvent(
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
      
      if (!session.client_reference_id) {
        throw new Error('No client_reference_id found in session');
      }

      console.log('Session details:', {
        id: session.id,
        clientReferenceId: session.client_reference_id,
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

      // Allocate credits using our new transaction function
      const { data: allocationResult, error: allocationError } = await supabaseAdmin.rpc(
        'allocate_credits',
        {
          p_user_id: session.client_reference_id,
          p_credits: planData.credits,
          p_payment_id: session.id,
          p_description: `Credits from ${planData.name} plan purchase`
        }
      );

      if (allocationError) {
        console.error('Credits allocation failed:', allocationError);
        throw allocationError;
      }

      console.log('Credits allocation result:', allocationResult);
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