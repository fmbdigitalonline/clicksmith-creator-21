
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface ContactSubmission {
  type: string;
  name: string;
  email: string;
  message: string;
  attachments?: Array<{
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
}

interface NewsletterSubmission {
  type: string;
  email: string;
}

type Submission = ContactSubmission | NewsletterSubmission;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing submission...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json() as Submission
    console.log('Received submission:', body)

    if (!body.type || !body.email) {
      throw new Error('Missing required fields')
    }

    if (body.type === 'contact') {
      if (!body.name || !body.message) {
        throw new Error('Missing required fields for contact submission')
      }

      // Store the contact submission
      const { error: dbError } = await supabase
        .from('contact_submissions')
        .insert({
          name: body.name,
          email: body.email,
          message: body.message,
          attachments: body.attachments || [],
          status: 'pending',
          metadata: {
            userAgent: req.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          }
        })

      if (dbError) {
        console.error('Database error:', dbError)
        throw dbError
      }

      console.log('Successfully stored contact submission')
    } else if (body.type === 'newsletter') {
      // Handle newsletter subscription
      const { error: dbError } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email: body.email,
          status: 'pending',
          metadata: {
            userAgent: req.headers.get('user-agent'),
            timestamp: new Date().toISOString(),
            source: 'website_footer'
          }
        })
        .select()
        .single()

      if (dbError) {
        // Check if it's a unique violation (email already exists)
        if (dbError.code === '23505') {
          return new Response(
            JSON.stringify({
              success: false,
              message: 'This email is already subscribed to our newsletter.'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          )
        }
        console.error('Database error:', dbError)
        throw dbError
      }

      console.log('Successfully stored newsletter subscription')
    } else {
      throw new Error('Invalid submission type')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Submission received successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error processing submission:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
