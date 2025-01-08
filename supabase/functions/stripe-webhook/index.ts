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

      // Get price ID
      let priceId;
      try {
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          priceId = subscription.items.data[0].price.id;
          console.log('Retrieved price ID from subscription:', priceId);
        } else {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price']
          });
          priceId = lineItems.data[0].price?.id;
          console.log('Retrieved price ID from line items:', priceId);
        }

        if (!priceId) {
          console.error('No price ID found in session data');
          throw new Error('No price ID found');
        }
      } catch (err) {
        console.error('Failed to retrieve price ID:', err);
        throw err;
      }

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

        // Debug: Log all available plans
        const { data: allPlans, error: plansError } = await supabaseAdmin
          .from('plans')
          .select('*');
        
        if (plansError) {
          console.error('Error fetching all plans:', plansError);
        } else {
          console.log('Available plans:', {
            count: allPlans?.length || 0,
            plans: allPlans?.map(p => ({
              id: p.id,
              name: p.name,
              stripe_price_id: p.stripe_price_id
            }))
          });
        }

        // Fetch specific plan
        const { data: planData, error: planError } = await supabaseAdmin
          .from('plans')
          .select('*')
          .eq('stripe_price_id', priceId)
          .single();

        if (planError) {
          console.error('Failed to fetch plan:', {
            error: planError,
            priceId: priceId,
            errorCode: planError.code,
            errorMessage: planError.message,
            errorDetails: planError.details
          });
          throw planError;
        }

        if (!planData) {
          console.error('No plan found for price ID:', priceId);
          throw new Error('No matching plan found');
        }

        console.log('Plan details retrieved:', {
          planId: planData.id,
          credits: planData.credits,
          name: planData.name,
          stripe_price_id: planData.stripe_price_id
        });

        // Create credit operation record
        const { error: creditOpError } = await supabaseAdmin
          .from('credit_operations')
          .insert({
            user_id: session.client_reference_id,
            operation_type: 'purchase',
            credits_amount: planData.credits,
            status: 'success'
          });

        if (creditOpError) {
          console.error('Failed to create credit operation:', creditOpError);
          throw creditOpError;
        }

        console.log('Credit operation created successfully');

        // Add credits to user's account
        const { data: creditsResult, error: creditsError } = await supabaseAdmin.rpc(
          'add_user_credits',
          {
            p_user_id: session.client_reference_id,
            p_credits: planData.credits
          }
        );

        if (creditsError || !creditsResult?.success) {
          console.error('Failed to add credits:', {
            error: creditsError,
            result: creditsResult
          });
          throw new Error(creditsError?.message || creditsResult?.error_message || 'Failed to add credits');
        }

        console.log('Credits added successfully:', {
          userId: session.client_reference_id,
          creditsAdded: planData.credits,
          currentCredits: creditsResult.current_credits
        });

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