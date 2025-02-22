
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json() as ContactSubmission
    console.log('Received submission:', body)

    if (!body.type || !body.name || !body.email || !body.message) {
      throw new Error('Missing required fields')
    }

    const { error } = await supabase
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

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    // Here you would typically add code to send email notifications
    // using your preferred email service provider

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
