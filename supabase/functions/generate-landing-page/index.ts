
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(supabaseUrl!, supabaseKey!)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { projectId, businessName, businessIdea, targetAudience } = await req.json()
    const startTime = performance.now()
    
    console.log('Generating landing page for project:', projectId)

    // First, try to find cached content
    const { data: cachedContent } = await supabase
      .from('landing_page_cache')
      .select('content')
      .eq('business_type', businessIdea?.type)
      .eq('value_proposition', businessIdea?.valueProposition)
      .order('used_count', { ascending: false })
      .limit(1)
      .single()

    let content
    let cacheHit = false

    if (cachedContent) {
      console.log('Cache hit! Using cached content')
      content = cachedContent.content
      cacheHit = true

      // Update cache usage statistics
      await supabase
        .from('landing_page_cache')
        .update({
          used_count: cachedContent.used_count + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', cachedContent.id)
    } else {
      console.log('Cache miss. Generating new content...')
      // Generate new content - your existing content generation logic here
      content = {
        hero: {
          title: businessName,
          description: businessIdea?.valueProposition || '',
          cta: "Get Started Now"
        },
        value_proposition: {
          title: "Why Choose Us",
          features: [
            { title: "Feature 1", description: "Description 1" },
            { title: "Feature 2", description: "Description 2" },
            { title: "Feature 3", description: "Description 3" }
          ]
        },
        features: {
          title: "Our Features",
          items: [
            { title: "Core Feature 1", description: "Description 1" },
            { title: "Core Feature 2", description: "Description 2" },
            { title: "Core Feature 3", description: "Description 3" }
          ]
        },
        proof: {
          title: "What Our Customers Say",
          testimonials: [
            { quote: "Great service!", author: "John Doe" },
            { quote: "Amazing product!", author: "Jane Smith" }
          ]
        },
        pricing: {
          title: "Pricing Plans",
          plans: [
            { name: "Basic", price: "$9", features: ["Feature 1", "Feature 2"] },
            { name: "Pro", price: "$29", features: ["Feature 1", "Feature 2", "Feature 3"] }
          ]
        },
        finalCta: {
          title: "Ready to Get Started?",
          description: "Join thousands of satisfied customers",
          buttonText: "Start Now"
        },
        footer: {
          companyName: businessName,
          links: [
            { text: "About Us", url: "#" },
            { text: "Contact", url: "#" },
            { text: "Terms", url: "#" }
          ]
        }
      }

      // Cache the new content
      await supabase
        .from('landing_page_cache')
        .insert({
          business_type: businessIdea?.type,
          value_proposition: businessIdea?.valueProposition,
          target_audience: targetAudience,
          content: content,
          used_count: 1,
          last_used_at: new Date().toISOString()
        })
    }

    const endTime = performance.now()
    const generationTime = endTime - startTime

    // Log the generation attempt
    await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: projectId,
        request_payload: { businessName, businessIdea, targetAudience },
        response_payload: content,
        success: true,
        generation_time: generationTime,
        cache_hit: cacheHit,
        api_status_code: 200
      })

    return new Response(
      JSON.stringify(content),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)

    // Log the error
    await supabase
      .from('landing_page_generation_logs')
      .insert({
        project_id: req.body?.projectId,
        request_payload: req.body,
        success: false,
        error_message: error.message,
        api_status_code: 500
      })

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
