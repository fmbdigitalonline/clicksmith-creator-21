
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactSubmission {
  name: string;
  email: string;
  message: string;
}

interface NewsletterSubscription {
  email: string;
}

async function handleContactSubmission(submission: ContactSubmission) {
  try {
    const { error } = await supabase
      .from("contact_submissions")
      .insert([submission]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error handling contact submission:", error);
    throw error;
  }
}

async function handleNewsletterSubscription(subscription: NewsletterSubscription) {
  try {
    const { error } = await supabase
      .from("newsletter_subscriptions")
      .insert([subscription]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error handling newsletter subscription:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, ...data } = await req.json();

    let result;
    if (type === "contact") {
      result = await handleContactSubmission(data as ContactSubmission);
    } else if (type === "newsletter") {
      result = await handleNewsletterSubscription(data as NewsletterSubscription);
    } else {
      throw new Error("Invalid submission type");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in handle-submissions function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
