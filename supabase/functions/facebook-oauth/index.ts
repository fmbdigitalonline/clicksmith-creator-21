
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const facebookAppId = Deno.env.get("FACEBOOK_APP_ID") || "";
    const facebookAppSecret = Deno.env.get("FACEBOOK_APP_SECRET") || "";
    const redirectUri = Deno.env.get("FACEBOOK_REDIRECT_URI") || "";

    // Log configuration for debugging
    console.log("facebook-oauth function started with configuration:", {
      facebookAppIdExists: !!facebookAppId,
      facebookAppIdLength: facebookAppId.length,
      facebookAppSecretExists: !!facebookAppSecret,
      facebookAppSecretLength: facebookAppSecret.length,
      redirectUriExists: !!redirectUri,
      redirectUriValue: redirectUri,
      supabaseUrlExists: !!supabaseUrl,
      supabaseServiceRoleKeyExists: !!supabaseServiceKey
    });

    if (!facebookAppId || !facebookAppSecret || !redirectUri) {
      console.error("Missing required environment variables:", {
        facebookAppId: !!facebookAppId,
        facebookAppSecret: !!facebookAppSecret,
        redirectUri: !!redirectUri
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required environment variables for Facebook OAuth"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Initialize Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorReason = searchParams.get("error_reason");
    const errorDescription = searchParams.get("error_description");
    const state = searchParams.get("state");

    console.log("Received OAuth request:", { code, error, state });

    // Handle errors from Facebook
    if (error || errorReason || errorDescription) {
      console.error("Facebook OAuth error:", { error, errorReason, errorDescription });
      return new Response(
        JSON.stringify({
          success: false,
          error: errorDescription || errorReason || error,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // If no code is provided, redirect to Facebook OAuth
    if (!code) {
      const oauthState = Math.random().toString(36).substring(2, 15);
      const facebookAuthUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
      facebookAuthUrl.searchParams.append("client_id", facebookAppId);
      facebookAuthUrl.searchParams.append("redirect_uri", redirectUri);
      facebookAuthUrl.searchParams.append("state", oauthState);
      // Include all required permissions for Facebook Ads management and image upload capabilities
      facebookAuthUrl.searchParams.append("scope", "ads_management,ads_read,business_management,pages_show_list,pages_read_engagement,ads_images:read,ads_images:write,catalog_management,instagram_basic,instagram_content_publish,Instagram_manage_comments");
      facebookAuthUrl.searchParams.append("response_type", "code");

      console.log("Redirecting to Facebook OAuth:", facebookAuthUrl.toString());

      return new Response(null, {
        headers: {
          ...corsHeaders,
          "Location": facebookAuthUrl.toString(),
        },
        status: 302,
      });
    }

    // Exchange the auth code for an access token
    console.log("Exchanging code for token...");
    const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    tokenUrl.searchParams.append("client_id", facebookAppId);
    tokenUrl.searchParams.append("client_secret", facebookAppSecret);
    tokenUrl.searchParams.append("redirect_uri", redirectUri);
    tokenUrl.searchParams.append("code", code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error("Token exchange error:", tokenData);
      return new Response(
        JSON.stringify({
          success: false,
          error: tokenData.error?.message || "Failed to exchange code for token",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 0;
    
    if (!accessToken) {
      console.error("No access token returned");
      return new Response(
        JSON.stringify({
          success: false,
          error: "No access token returned from Facebook",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get Facebook user details
    console.log("Getting Facebook user data...");
    const meResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${accessToken}`);
    const meData = await meResponse.json();

    if (!meResponse.ok || meData.error) {
      console.error("Facebook user data error:", meData);
      return new Response(
        JSON.stringify({
          success: false,
          error: meData.error?.message || "Failed to fetch Facebook user data",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get Facebook ad accounts with detailed information
    console.log("Getting Facebook ad accounts...");
    const adAccountsResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_id,account_status,currency,timezone_name,capabilities&access_token=${accessToken}`
    );
    const adAccountsData = await adAccountsResponse.json();

    if (!adAccountsResponse.ok || adAccountsData.error) {
      console.error("Facebook ad accounts error:", adAccountsData);
      return new Response(
        JSON.stringify({
          success: false,
          error: adAccountsData.error?.message || "Failed to fetch ad accounts",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get Facebook pages with detailed information
    console.log("Getting Facebook pages...");
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=name,access_token,category,fan_count,followers_count&access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();
    
    // We don't fail the entire flow if pages fetch fails
    if (!pagesResponse.ok || pagesData.error) {
      console.warn("Facebook pages error (continuing anyway):", pagesData);
    }

    // Get the user ID from the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("User authentication error:", userError);
      return new Response(
        JSON.stringify({
          success: false,
          error: userError?.message || "User authentication failed",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString();

    // Store the connection data in the database
    console.log("Storing connection data...");
    const { data: connectionData, error: connectionError } = await supabase
      .from("platform_connections")
      .upsert(
        {
          user_id: user.id,
          platform: "facebook",
          access_token: accessToken,
          token_expires_at: expiresAt,
          metadata: {
            facebook_user_id: meData.id,
            ad_accounts: adAccountsData.data,
            pages: pagesData.error ? [] : pagesData.data,
            last_fetched: new Date().toISOString()
          },
        },
        {
          onConflict: "user_id,platform",
        }
      )
      .select();

    if (connectionError) {
      console.error("Connection storage error:", connectionError);
      return new Response(
        JSON.stringify({
          success: false,
          error: connectionError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("OAuth flow completed successfully");

    // Return a success page that will close the popup and notify the parent window
    const successHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Connected to Facebook</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #f9fafb;
              color: #111827;
            }
            .card {
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              padding: 24px;
              text-align: center;
              max-width: 400px;
            }
            h1 {
              margin-bottom: 16px;
            }
            p {
              margin-bottom: 24px;
              color: #4b5563;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Successfully Connected to Facebook</h1>
            <p>You can now close this window and return to the app.</p>
          </div>
          <script>
            // Send a message to the parent window and close this popup
            window.opener.postMessage({ type: 'FACEBOOK_OAUTH_SUCCESS' }, '*');
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `;

    return new Response(successHtml, {
      headers: { ...corsHeaders, "Content-Type": "text/html" },
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
