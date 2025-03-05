
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const FacebookCallback = () => {
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const code = params.get("code");
        const state = params.get("state");
        
        if (!code) {
          const error = params.get("error") || "Missing authorization code";
          const errorDescription = params.get("error_description") || "Could not connect to Facebook";
          throw new Error(`${error}: ${errorDescription}`);
        }
        
        // Get saved state from localStorage
        const savedState = localStorage.getItem("facebook_auth_state");
        if (!savedState || savedState !== state) {
          throw new Error("Invalid state parameter. Please try again.");
        }
        
        // Exchange code for token
        const { data, error } = await supabase.functions.invoke("facebook-auth", {
          body: { action: "exchange_code", code, state, savedState },
        });
        
        if (error) throw error;
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");
        
        // Save connection to database
        let accountId = null;
        let accountName = null;
        
        if (data.adAccounts && data.adAccounts.data && data.adAccounts.data.length > 0) {
          // Take the first active ad account
          const activeAccount = data.adAccounts.data.find((account: any) => account.account_status === 1);
          if (activeAccount) {
            accountId = activeAccount.id.replace("act_", "");
            accountName = activeAccount.name;
          }
        }
        
        await supabase.from("platform_connections").insert({
          user_id: user.id,
          platform: "facebook",
          access_token: data.access_token,
          token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
          account_id: accountId,
          account_name: accountName || data.user?.name || "Facebook Account"
        });
        
        setStatus("success");
        
        toast({
          title: "Connected to Facebook",
          description: "Your Facebook account is now connected.",
        });
        
        // Clear state
        localStorage.removeItem("facebook_auth_state");
        
        // Redirect back
        setTimeout(() => {
          navigate("/projects");
        }, 2000);
      } catch (error) {
        console.error("Error in Facebook callback:", error);
        setStatus("error");
        setErrorMessage(error.message || "Failed to connect with Facebook");
        
        toast({
          title: "Connection Failed",
          description: error.message || "Could not connect to Facebook",
          variant: "destructive",
        });
      }
    };
    
    handleCallback();
  }, [location.search, navigate, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md w-full p-8 rounded-lg shadow-md space-y-6 bg-white">
        <h1 className="text-2xl font-bold text-center">
          {status === "processing" && "Connecting to Facebook"}
          {status === "success" && "Connected to Facebook"}
          {status === "error" && "Connection Failed"}
        </h1>
        
        <div className="flex justify-center">
          {status === "processing" && (
            <Loader2 className="h-12 w-12 text-facebook animate-spin" />
          )}
          {status === "success" && (
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {status === "error" && (
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        
        <p className="text-center text-gray-600">
          {status === "processing" && "Please wait while we connect your Facebook account..."}
          {status === "success" && "Your Facebook account has been successfully connected. Redirecting..."}
          {status === "error" && errorMessage}
        </p>
      </div>
    </div>
  );
};
