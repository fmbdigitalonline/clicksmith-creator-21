
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// The Facebook Graph API version to use
const FACEBOOK_API_VERSION = "v19.0";

interface FacebookAuthRequest {
  code?: string;
  accessToken?: string;
  action: "exchange" | "verify" | "accounts" | "revoke" | "config";
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AdAccountResponse {
  data: Array<{
    id: string;
    name: string;
    account_status: number;
    currency: string;
    business_name?: string;
  }>;
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { url, method } = req;
    console.log(`facebook-auth function called: ${method} ${url}`);

    // Get environment variables
    const CLIENT_ID = Deno.env.get("FACEBOOK_APP_ID");
    const CLIENT_SECRET = Deno.env.get("FACEBOOK_APP_SECRET");
    const REDIRECT_URI = Deno.env.get("FACEBOOK_REDIRECT_URI");

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      throw new Error("Missing required environment variables for Facebook OAuth");
    }

    // Parse request body
    let body: FacebookAuthRequest = { action: "verify" };
    if (method === "POST") {
      const requestJson = await req.json();
      body = requestJson as FacebookAuthRequest;
    }

    // Handle different actions
    let responseData;
    switch (body.action) {
      case "config":
        // Return the app configuration (client ID and redirect URI)
        responseData = {
          appId: CLIENT_ID,
          redirectUri: REDIRECT_URI
        };
        break;
        
      case "exchange":
        // Exchange authorization code for access token
        if (!body.code) {
          throw new Error("Authorization code is required");
        }
        
        console.log("Exchanging code for access token");
        const tokenUrl = new URL(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/oauth/access_token`);
        tokenUrl.searchParams.append("client_id", CLIENT_ID);
        tokenUrl.searchParams.append("redirect_uri", REDIRECT_URI);
        tokenUrl.searchParams.append("client_secret", CLIENT_SECRET);
        tokenUrl.searchParams.append("code", body.code);

        const tokenResponse = await fetch(tokenUrl.toString());
        const tokenData: TokenResponse = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
          console.error("Error exchanging code:", tokenData);
          throw new Error(`Failed to exchange code: ${JSON.stringify(tokenData)}`);
        }
        
        responseData = {
          accessToken: tokenData.access_token,
          expiresIn: tokenData.expires_in,
          tokenType: tokenData.token_type,
        };
        break;

      case "verify":
        // Verify an access token and get basic user info
        if (!body.accessToken) {
          throw new Error("Access token is required");
        }
        
        console.log("Verifying access token");
        const verifyUrl = new URL(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/me`);
        verifyUrl.searchParams.append("access_token", body.accessToken);
        verifyUrl.searchParams.append("fields", "id,name,email");

        const verifyResponse = await fetch(verifyUrl.toString());
        const userData = await verifyResponse.json();
        
        if (!verifyResponse.ok) {
          console.error("Error verifying token:", userData);
          throw new Error(`Failed to verify token: ${JSON.stringify(userData)}`);
        }
        
        responseData = userData;
        break;

      case "accounts":
        // Get available ad accounts for the user
        if (!body.accessToken) {
          throw new Error("Access token is required");
        }
        
        console.log("Fetching ad accounts");
        const accountsUrl = new URL(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/me/adaccounts`);
        accountsUrl.searchParams.append("access_token", body.accessToken);
        accountsUrl.searchParams.append("fields", "id,name,account_status,currency,business_name");

        const accountsResponse = await fetch(accountsUrl.toString());
        const accountsData: AdAccountResponse = await accountsResponse.json();
        
        if (!accountsResponse.ok) {
          console.error("Error fetching ad accounts:", accountsData);
          throw new Error(`Failed to fetch ad accounts: ${JSON.stringify(accountsData)}`);
        }
        
        // Filter active accounts (account_status = 1)
        responseData = {
          accounts: accountsData.data.filter(account => account.account_status === 1),
          paging: accountsData.paging,
        };
        break;

      case "revoke":
        // Revoke the access token
        if (!body.accessToken) {
          throw new Error("Access token is required");
        }
        
        console.log("Revoking access token");
        const revokeUrl = new URL(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/me/permissions`);
        revokeUrl.searchParams.append("access_token", body.accessToken);

        const revokeResponse = await fetch(revokeUrl.toString(), { method: "DELETE" });
        const revokeData = await revokeResponse.json();
        
        if (!revokeResponse.ok) {
          console.error("Error revoking token:", revokeData);
          throw new Error(`Failed to revoke token: ${JSON.stringify(revokeData)}`);
        }
        
        responseData = { success: true };
        break;

      default:
        throw new Error(`Unsupported action: ${body.action}`);
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in facebook-auth function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred during Facebook authentication",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
