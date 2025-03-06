
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Facebook, Check, AlertCircle, Loader2, ChevronDown, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// URL redirecting to Facebook OAuth with environment variables
const generateFacebookAuthURL = () => {
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
  
  if (!facebookAppId) {
    console.error("Missing Facebook App ID in environment variables");
    return "";
  }
  
  // Use the redirect URI from env var, or fallback to current origin + path
  let redirectUri = import.meta.env.VITE_FACEBOOK_REDIRECT_URI;
  if (!redirectUri) {
    redirectUri = encodeURIComponent(window.location.origin + "/integrations?connection=facebook");
  } else {
    // If it's not already encoded, encode it
    if (!redirectUri.includes('%')) {
      redirectUri = encodeURIComponent(redirectUri);
    }
  }
  
  const scopes = encodeURIComponent("ads_management,ads_read");
  
  console.log("Generating Facebook Auth URL with redirectUri:", redirectUri);
  
  return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${facebookAppId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code`;
};

interface PlatformConnection {
  id: string;
  platform: string;
  account_id: string | null;
  account_name: string | null;
  created_at: string;
  updated_at: string;
}

interface FacebookConnectionProps {
  onConnectionChange?: () => void;
}

export default function FacebookConnection({ onConnectionChange }: FacebookConnectionProps) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [connection, setConnection] = useState<PlatformConnection | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const session = useSession();

  // Enhanced connection validation
  const fetchConnectionStatus = async () => {
    if (!session) {
      setIsLoading(false);
      return false;
    }
    
    try {
      console.log("Checking Facebook connection status...");
      const { data, error } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('platform', 'facebook')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error validating connection:", error);
        return false;
      }
      
      // Check if token is expired
      if (data && data.token_expires_at) {
        const expiryDate = new Date(data.token_expires_at);
        if (expiryDate < new Date()) {
          console.log("Facebook token has expired", data);
          toast({
            title: "Connection Expired",
            description: "Your Facebook connection has expired. Please reconnect.",
            variant: "warning",
          });
          return false;
        }
      }
      
      console.log("Facebook connection data:", data);
      if (data) {
        setConnection(data);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error validating connection:", error);
      return false;
    }
  };

  // Check connection status
  useEffect(() => {
    async function checkConnectionStatus() {
      if (!session) {
        setIsLoading(false);
        return;
      }
      
      try {
        const isConnected = await fetchConnectionStatus();
        setIsConnected(isConnected);
      } catch (error) {
        console.error("Error checking connection status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkConnectionStatus();
  }, [session, toast]);

  // Handle connection click
  const handleConnect = () => {
    setErrorMessage(null);
    
    const authUrl = generateFacebookAuthURL();
    if (!authUrl) {
      setErrorMessage("Facebook App ID is missing in configuration.");
      toast({
        title: "Configuration Error",
        description: "Facebook App ID is missing. Please contact the administrator.",
        variant: "destructive",
      });
      return;
    }
    
    // Enhanced logging for debugging
    console.log("Facebook connection details:", {
      appId: import.meta.env.VITE_FACEBOOK_APP_ID ? "configured" : "missing",
      redirectUri: import.meta.env.VITE_FACEBOOK_REDIRECT_URI,
      authUrl: authUrl
    });
    
    window.location.href = authUrl;
  };

  // Handle disconnection
  const handleDisconnect = async () => {
    if (!session) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('platform_connections')
        .delete()
        .eq('platform', 'facebook');

      if (error) {
        throw error;
      }

      setIsConnected(false);
      setConnection(null);
      
      toast({
        title: "Disconnected",
        description: "Your Facebook Ads account has been disconnected",
      });
      
      if (onConnectionChange) {
        onConnectionChange();
      }
    } catch (error) {
      console.error("Error disconnecting account:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect your account",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Create campaign
  const handleCreateCampaign = async () => {
    toast({
      title: "Campaign Creation",
      description: "Campaign creation feature is under development",
    });
    
    // This will be expanded in future phases
    setShowDetails(!showDetails);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Facebook className="w-5 h-5 mr-2" /> Facebook Ads
          </CardTitle>
          <CardDescription>Connect your Facebook Ads account</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Facebook className="w-5 h-5 mr-2" /> Facebook Ads
          </CardTitle>
          {isConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Check className="w-3 h-3 mr-1" /> Connected
            </Badge>
          )}
        </div>
        <CardDescription>
          Connect your Facebook Ads account to create and manage campaigns
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {errorMessage}
              {errorMessage.includes("Missing") && (
                <div className="mt-2">
                  <p className="text-sm">Please check if:</p>
                  <ul className="list-disc list-inside text-sm ml-2 mt-1">
                    <li>Your Facebook App ID is correct in the .env file</li>
                    <li>Your Facebook Redirect URI is correct in the .env file</li>
                    <li>The Facebook App has the exact same Redirect URI in its settings</li>
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      
        {isConnected && connection ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Account:</span>
              <span className="font-medium">{connection.account_name || 'Default Account'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Connected on:</span>
              <span className="font-medium">
                {new Date(connection.created_at).toLocaleDateString()}
              </span>
            </div>
            
            {isConnected && (
              <Collapsible open={showDetails} onOpenChange={setShowDetails} className="mt-4">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="flex items-center justify-between w-full mt-2">
                    <span>Ad Campaign Details</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4 p-4 border rounded-md">
                  <div className="space-y-2">
                    <h4 className="font-medium">Campaign Status</h4>
                    <p className="text-sm text-muted-foreground">
                      Create a new Facebook ad campaign from your saved ad creatives. 
                      You'll be able to review and edit all details before the campaign goes live.
                    </p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCreateCampaign}
                    disabled={isProcessing}
                  >
                    Create Campaign
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-4">
              Connect your Facebook Ads account to automate ad creation and campaign management directly from this dashboard.
            </p>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important Facebook Setup</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>Make sure your Facebook App settings include <strong>{window.location.origin}/integrations?connection=facebook</strong> as a valid OAuth redirect URI.</p>
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <p>Current environment configuration:</p>
                </div>
                <div className="text-xs bg-muted p-2 rounded overflow-auto">
                  <p>App ID: {import.meta.env.VITE_FACEBOOK_APP_ID ? import.meta.env.VITE_FACEBOOK_APP_ID : "Not configured"}</p>
                  <p>Redirect URI: {import.meta.env.VITE_FACEBOOK_REDIRECT_URI || "Not configured"}</p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <a 
                    href="https://developers.facebook.com/apps/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-blue-600 hover:underline"
                  >
                    Facebook Developers Console <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {isConnected ? (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleDisconnect}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Disconnecting...
              </>
            ) : (
              'Disconnect Account'
            )}
          </Button>
        ) : (
          <Button 
            className="w-full" 
            onClick={handleConnect}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Facebook Ads'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
