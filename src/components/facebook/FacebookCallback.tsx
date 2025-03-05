
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function FacebookCallback() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Parse the URL to get the code and state
        const params = new URLSearchParams(location.search);
        const code = params.get("code");
        const stateParam = params.get("state");
        
        if (!code) {
          throw new Error("Authorization code not found in the callback URL");
        }

        // Parse the state parameter (contains userId)
        let state = {};
        try {
          if (stateParam) {
            state = JSON.parse(stateParam);
          }
        } catch (parseError) {
          console.error("Error parsing state parameter:", parseError);
        }

        // Exchange the code for an access token
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke("facebook-auth", {
          body: {
            action: "exchange",
            code
          }
        });

        if (tokenError || !tokenData || tokenData.error) {
          throw new Error(tokenError?.message || tokenData?.error || "Failed to exchange code for token");
        }

        const { accessToken, expiresIn } = tokenData;

        // Verify the token to get user info
        const { data: userData, error: userError } = await supabase.functions.invoke("facebook-auth", {
          body: {
            action: "verify",
            accessToken
          }
        });

        if (userError || !userData || userData.error) {
          throw new Error(userError?.message || userData?.error || "Failed to verify token");
        }

        // Get user's ad accounts
        const { data: accountsData, error: accountsError } = await supabase.functions.invoke("facebook-auth", {
          body: {
            action: "accounts",
            accessToken
          }
        });

        if (accountsError || !accountsData || accountsData.error) {
          throw new Error(accountsError?.message || accountsData?.error || "Failed to fetch ad accounts");
        }

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not authenticated");
        }

        // Calculate token expiry time
        const tokenExpiresAt = new Date();
        tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expiresIn);

        // Choose the first ad account or null if none available
        const selectedAdAccount = accountsData.accounts && accountsData.accounts.length > 0 
          ? accountsData.accounts[0].id 
          : null;

        // Store the connection in the database
        const { error: dbError } = await supabase
          .from("platform_connections")
          .upsert({
            user_id: user.id,
            platform: "facebook",
            access_token: accessToken,
            token_expires_at: tokenExpiresAt.toISOString(),
            account_id: userData.id,
            account_name: userData.name,
            selected_ad_account_id: selectedAdAccount
          }, { onConflict: "user_id,platform" });

        if (dbError) {
          throw new Error(`Failed to store connection: ${dbError.message}`);
        }

        // Show success notification
        toast({
          title: "Connected to Facebook",
          description: "Your Facebook account has been successfully connected.",
        });

        // Redirect back to the project
        setIsProcessing(false);
        navigate("/projects");
        
      } catch (error) {
        console.error("Error processing Facebook callback:", error);
        setError(error.message || "An error occurred during Facebook authentication");
        setIsProcessing(false);
        
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect to Facebook. Please try again.",
          variant: "destructive",
        });
        
        // Redirect to projects after a delay
        setTimeout(() => {
          navigate("/projects");
        }, 3000);
      }
    };

    processCallback();
  }, [location, navigate, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      {isProcessing ? (
        <>
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <h1 className="text-2xl font-bold mb-2">Connecting to Facebook</h1>
          <p className="text-muted-foreground">Please wait while we establish your connection...</p>
        </>
      ) : error ? (
        <>
          <div className="h-12 w-12 text-destructive mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Connection Failed</h1>
          <p className="text-muted-foreground">{error}</p>
          <p className="mt-4">You'll be redirected back to your projects shortly.</p>
        </>
      ) : (
        <>
          <div className="h-12 w-12 text-success mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-2">Successfully Connected!</h1>
          <p className="text-muted-foreground">You have successfully connected your Facebook account.</p>
          <p className="mt-4">You'll be redirected back to your projects shortly.</p>
        </>
      )}
    </div>
  );
}
