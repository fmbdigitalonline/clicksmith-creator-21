
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

// Initialize Resend
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "your-email@example.com";
const FROM_EMAIL = "notifications@yourdomain.com";

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
    // Store in database
    const { data, error } = await supabase
      .from("contact_submissions")
      .insert([submission]);

    if (error) throw error;

    // Send confirmation to user
    await resend.emails.send({
      from: FROM_EMAIL,
      to: submission.email,
      subject: "We received your message!",
      html: `
        <h1>Thank you for contacting us, ${submission.name}!</h1>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p>Best regards,<br>Your Team</p>
      `,
    });

    // Send notification to admin
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: "New Contact Form Submission",
      html: `
        <h1>New Contact Form Submission</h1>
        <p><strong>Name:</strong> ${submission.name}</p>
        <p><strong>Email:</strong> ${submission.email}</p>
        <p><strong>Message:</strong></p>
        <p>${submission.message}</p>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error handling contact submission:", error);
    throw error;
  }
}

async function handleNewsletterSubscription(subscription: NewsletterSubscription) {
  try {
    // Store in database
    const { data, error } = await supabase
      .from("newsletter_subscriptions")
      .insert([subscription]);

    if (error) throw error;

    // Send confirmation to subscriber
    await resend.emails.send({
      from: FROM_EMAIL,
      to: subscription.email,
      subject: "Welcome to Our Newsletter!",
      html: `
        <h1>Thank you for subscribing!</h1>
        <p>You're now subscribed to our newsletter. You'll receive updates about our latest content and features.</p>
        <p>Best regards,<br>Your Team</p>
      `,
    });

    // Send notification to admin
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: "New Newsletter Subscription",
      html: `
        <h1>New Newsletter Subscription</h1>
        <p><strong>Email:</strong> ${subscription.email}</p>
      `,
    });

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
