
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Facebook, Check, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";

// URL redirecting to Facebook OAuth
const generateFacebookAuthURL = () => {
  const facebookAppId = "YOUR_FACEBOOK_APP_ID"; // Replace with your app ID
  const redirectUri = encodeURIComponent(window.location.origin + "/dashboard?connection=facebook");
  const scopes = encodeURIComponent("ads_management,ads_read");
  
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

export default function FacebookConnection() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [connection, setConnection] = useState<PlatformConnection | null>(null);
  const { toast } = useToast();
  const session = useSession();

  // Check connection status
  useEffect(() => {
    async function checkConnectionStatus() {
      if (!session) return;
      
      try {
        const { data, error } = await supabase
          .from('platform_connections')
          .select('*')
          .eq('platform', 'facebook')
          .single();

        if (error) {
          console.error("Error fetching connection:", error);
          if (error.code !== 'PGRST116') { // not_found error
            toast({
              title: "Error",
              description: "Failed to check connection status",
              variant: "destructive",
            });
          }
        } else if (data) {
          setIsConnected(true);
          setConnection(data);
        }
      } catch (error) {
        console.error("Error checking connection status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkConnectionStatus();
  }, [session, toast]);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (!session) return;
      
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const connectionType = url.searchParams.get('connection');
      
      // Clean URL
      if (code && connectionType === 'facebook') {
        // Remove query parameters from URL
        window.history.replaceState({}, document.title, "/dashboard");
        
        setIsProcessing(true);
        
        try {
          const response = await supabase.functions.invoke('facebook-oauth', {
            body: { code },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (response.error) {
            throw new Error(response.error);
          }

          toast({
            title: "Success!",
            description: "Your Facebook Ads account has been connected",
          });
          
          // Refresh connection data
          const { data } = await supabase
            .from('platform_connections')
            .select('*')
            .eq('platform', 'facebook')
            .single();
            
          if (data) {
            setIsConnected(true);
            setConnection(data);
          }
        } catch (error) {
          console.error("Error processing OAuth callback:", error);
          toast({
            title: "Connection Failed",
            description: error instanceof Error ? error.message : "Failed to connect to Facebook",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      }
    };

    handleOAuthCallback();
  }, [session, toast]);

  // Handle connection click
  const handleConnect = () => {
    window.location.href = generateFacebookAuthURL();
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
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              Connect your Facebook Ads account to automate ad creation and campaign management directly from this dashboard.
            </p>
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
