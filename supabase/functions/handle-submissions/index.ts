
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
  attachments?: Array<{
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
}

interface NewsletterSubscription {
  email: string;
}

async function handleContactSubmission(submission: ContactSubmission) {
  console.log("Processing contact submission:", {
    ...submission,
    attachments: submission.attachments?.length || 0
  });
  
  try {
    const { error } = await supabase
      .from("contact_submissions")
      .insert([{
        name: submission.name,
        email: submission.email,
        message: submission.message,
        status: 'pending',
        attachments: submission.attachments || [],
        metadata: {
          hasAttachments: submission.attachments && submission.attachments.length > 0,
          submittedAt: new Date().toISOString()
        }
      }]);

    if (error) {
      console.error("Database error:", error);
      throw error;
    }
    
    console.log("Successfully stored contact submission");
    return { success: true };
  } catch (error) {
    console.error("Error handling contact submission:", error);
    throw error;
  }
}

async function handleNewsletterSubscription(subscription: NewsletterSubscription) {
  console.log("Processing newsletter subscription:", subscription);
  
  try {
    const { error } = await supabase
      .from("newsletter_subscriptions")
      .insert([{
        email: subscription.email,
        status: 'pending'
      }]);

    if (error) {
      console.error("Database error:", error);
      throw error;
    }
    
    console.log("Successfully stored newsletter subscription");
    return { success: true };
  } catch (error) {
    console.error("Error handling newsletter subscription:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    const { type, ...data } = await req.json();
    console.log("Processing request type:", type);

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
      JSON.stringify({ 
        error: error.message,
        details: error.details || null,
        code: error.code || null
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
