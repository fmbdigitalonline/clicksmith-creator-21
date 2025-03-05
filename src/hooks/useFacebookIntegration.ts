import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { useNavigate } from "react-router-dom";

export const useFacebookIntegration = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"not_connected" | "connected" | "error">("not_connected");
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [selectedAdAccount, setSelectedAdAccount] = useState<string | null>(null);
  const { toast } = useToast();
  const { checkCredits } = useCredits();
  const navigate = useNavigate();

  // Check if user has connected to Facebook
  const checkFacebookConnection = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setConnectionStatus("not_connected");
        return false;
      }

      const { data, error } = await supabase
        .from("platform_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("platform", "facebook")
        .single();

      if (error || !data) {
        setConnectionStatus("not_connected");
        return false;
      }

      // Check if token is still valid
      const tokenExpiresAt = new Date(data.token_expires_at);
      if (tokenExpiresAt < new Date()) {
        setConnectionStatus("error");
        toast({
          title: "Facebook connection expired",
          description: "Your connection to Facebook has expired. Please reconnect.",
          variant: "destructive",
        });
        return false;
      }

      // Verify token with Facebook API
      try {
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke("facebook-auth", {
          body: {
            action: "verify",
            accessToken: data.access_token
          }
        });

        if (verifyError || !verifyData || verifyData.error) {
          console.error("Error verifying Facebook token:", verifyError || verifyData.error);
          setConnectionStatus("error");
          return false;
        }

        // Fetch ad accounts
        const { data: accountsData, error: accountsError } = await supabase.functions.invoke("facebook-auth", {
          body: {
            action: "accounts",
            accessToken: data.access_token
          }
        });

        if (accountsError || !accountsData || accountsData.error) {
          console.error("Error fetching Facebook ad accounts:", accountsError || accountsData.error);
        } else {
          setAdAccounts(accountsData.accounts || []);
          // If user has a saved ad account ID, select it
          if (data.selected_ad_account_id) {
            setSelectedAdAccount(data.selected_ad_account_id);
          } else if (accountsData.accounts && accountsData.accounts.length > 0) {
            // Otherwise select the first one
            setSelectedAdAccount(accountsData.accounts[0].id);
          }
        }
      } catch (verifyError) {
        console.error("Error during Facebook verification:", verifyError);
        setConnectionStatus("error");
        return false;
      }

      setConnectionStatus("connected");
      return true;
    } catch (error) {
      console.error("Error checking Facebook connection:", error);
      setConnectionStatus("error");
      return false;
    }
  }, [toast]);

  // Initiate Facebook OAuth flow
  const connectToFacebook = async () => {
    try {
      setIsConnecting(true);
      
      // First check if user has enough credits
      const hasCredits = await checkCredits(5); // Publishing to Facebook costs 5 credits
      
      if (!hasCredits) {
        navigate('/pricing');
        return false;
      }
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Get the Facebook App configuration from the function
      const { data: appConfig, error: configError } = await supabase.functions.invoke("facebook-auth", {
        body: { action: "config" }
      });
      
      if (configError || !appConfig || appConfig.error) {
        throw new Error("Failed to get Facebook configuration");
      }
      
      // Calculate redirect URL - this should match what's configured in Facebook Developer console
      const redirectUri = appConfig.redirectUri || window.location.origin + '/facebook-callback';
      
      // Build the OAuth URL
      const oauthUrl = new URL(`https://www.facebook.com/v19.0/dialog/oauth`);
      oauthUrl.searchParams.append('client_id', appConfig.appId);
      oauthUrl.searchParams.append('redirect_uri', redirectUri);
      oauthUrl.searchParams.append('state', JSON.stringify({ userId: user.id }));
      oauthUrl.searchParams.append('scope', 'ads_management,ads_read,business_management');
      oauthUrl.searchParams.append('response_type', 'code');
      
      // Redirect to Facebook OAuth page
      window.location.href = oauthUrl.toString();
      return true;
    } catch (error) {
      console.error("Error connecting to Facebook:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to Facebook. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
      return false;
    }
  };

  // Publish ads to Facebook
  const publishToFacebook = async (projectId: string, campaignData: any, adVariants: any[]) => {
    try {
      setIsPublishing(true);
      
      // Check connection first
      const isConnected = await checkFacebookConnection();
      if (!isConnected) {
        const connectionSuccess = await connectToFacebook();
        if (!connectionSuccess) {
          setIsPublishing(false);
          return false;
        }
      }
      
      // Get user data and access token
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: connectionData, error: connectionError } = await supabase
        .from("platform_connections")
        .select("access_token")
        .eq("user_id", user.id)
        .eq("platform", "facebook")
        .single();

      if (connectionError || !connectionData) {
        throw new Error("Facebook connection not found");
      }

      const accessToken = connectionData.access_token;
      const adAccountId = selectedAdAccount;

      if (!adAccountId) {
        throw new Error("No ad account selected");
      }

      // Create campaign using the edge function
      const { data: campaignResult, error: campaignError } = await supabase.functions.invoke("facebook-campaign", {
        body: {
          accessToken,
          adAccountId,
          campaignName: campaignData.name,
          objective: campaignData.objective || "REACH",
          dailyBudget: campaignData.dailyBudget || 10,
          startDate: campaignData.startDate || new Date().toISOString(),
          endDate: campaignData.endDate,
          targeting: campaignData.targeting || {
            age_min: 18,
            age_max: 65,
            genders: [1, 2], // 1 = male, 2 = female
            geo_locations: {
              countries: ["US"]
            }
          }
        }
      });

      if (campaignError || !campaignResult || campaignResult.error) {
        throw new Error(`Failed to create campaign: ${campaignError || campaignResult?.error || "Unknown error"}`);
      }

      // Store the campaign in the database
      const { error: dbError } = await supabase
        .from("ad_campaigns")
        .insert({
          project_id: projectId,
          platform: "facebook",
          name: campaignData.name,
          platform_campaign_id: campaignResult.campaignId,
          platform_adset_id: campaignResult.adsetId,
          status: campaignResult.status,
          budget: campaignData.dailyBudget || 10,
          start_date: campaignData.startDate || new Date().toISOString(),
          end_date: campaignData.endDate,
          targeting: campaignData.targeting
        });

      if (dbError) {
        console.error("Error storing campaign in database:", dbError);
      }

      toast({
        title: "Campaign created",
        description: "Your Facebook campaign has been created successfully and is in PAUSED status.",
      });
      
      setIsPublishing(false);
      return true;
    } catch (error) {
      console.error("Error publishing to Facebook:", error);
      toast({
        title: "Publishing Error",
        description: error.message || "Failed to publish ads to Facebook. Please try again.",
        variant: "destructive",
      });
      setIsPublishing(false);
      return false;
    }
  };

  // Select a different ad account
  const selectAdAccount = async (accountId: string) => {
    try {
      setSelectedAdAccount(accountId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save selected ad account to database
      await supabase
        .from("platform_connections")
        .update({
          selected_ad_account_id: accountId,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .eq("platform", "facebook");
        
      return true;
    } catch (error) {
      console.error("Error selecting ad account:", error);
      return false;
    }
  };

  return {
    isConnecting,
    isPublishing,
    connectionStatus,
    adAccounts,
    selectedAdAccount,
    checkFacebookConnection,
    connectToFacebook,
    publishToFacebook,
    selectAdAccount
  };
};
