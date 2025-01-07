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
      
      // Validate required session data
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

        // Verify user exists in profiles table
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', session.client_reference_id)
          .single();

        if (profileError || !profile) {
          console.error('Profile verification failed:', {
            error: profileError,
            userId: session.client_reference_id
          });
          throw new Error(`User profile not found: ${session.client_reference_id}`);
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