import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Stripe } from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { handleCheckoutSession } from './handlers/checkoutHandler.ts';

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
      
      if (!session.client_reference_id) {
        console.error('Missing client_reference_id in session');
        throw new Error('No client_reference_id found in session');
      }

      console.log('Session details:', {
        id: session.id,
        clientReferenceId: session.client_reference_id,
        customerId: session.customer,
        mode: session.mode
      });

      try {
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

        // Get plan details based on price ID
        const { data: planData, error: planError } = await supabaseAdmin
          .from('plans')
          .select('*')
          .eq('stripe_price_id', session.line_items?.data[0]?.price?.id)
          .single();

        if (planError || !planData) {
          console.error('Failed to fetch plan:', planError);
          throw new Error('Failed to fetch plan details');
        }

        // Create credit operation record

// Update the operation type to match the constraint
const { error: creditOpError } = await supabaseAdmin
  .from('credit_operations')
  .insert({
    user_id: session.client_reference_id,
    operation_type: 'add',  // This matches our constraint
    credits_amount: planData.credits,
    status: 'success'
  });

        if (creditOpError) {
          console.error('Failed to create credit operation:', creditOpError);
          throw creditOpError;
        }

        // Add credits to user's account
        const { data: creditsResult, error: creditsError } = await supabaseAdmin.rpc(
          'add_user_credits',
          {
            p_user_id: session.client_reference_id,
            p_credits: planData.credits
          }
        );

        if (creditsError || !creditsResult?.success) {
          console.error('Failed to add credits:', creditsError || creditsResult?.error_message);
          throw new Error(creditsError?.message || creditsResult?.error_message || 'Failed to add credits');
        }

        await handleCheckoutSession(session, supabaseAdmin);
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
