
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Facebook } from "lucide-react";
import { facebookAdsService } from "@/services/facebookAdsService";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation, useNavigate } from "react-router-dom";

interface FacebookConnectProps {
  onConnected?: () => void;
}

const FacebookConnect = ({ onConnected }: FacebookConnectProps) => {
  const [connections, setConnections] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a code in the URL (OAuth callback)
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code && state === "facebook-callback") {
      handleOAuthCallback(code);
      // Clean up URL
      navigate(location.pathname, { replace: true });
    } else {
      loadConnections();
    }
  }, [location]);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const connections = await facebookAdsService.getConnections();
      setConnections(Array.isArray(connections) ? connections : []);
    } catch (error) {
      console.error("Error loading connections:", error);
      toast({
        title: "Error loading connections",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthCallback = async (code: string) => {
    try {
      setIsConnecting(true);
      const result = await facebookAdsService.handleCallback(code);
      
      toast({
        title: "Facebook connected!",
        description: "Your Facebook account has been connected successfully.",
      });
      
      await loadConnections();
      
      if (onConnected) {
        onConnected();
      }
    } catch (error) {
      console.error("Error connecting to Facebook:", error);
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to Facebook",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const connectFacebook = async () => {
    try {
      setIsConnecting(true);
      const authUrl = await facebookAdsService.getAuthUrl();
      
      // Save current path in state
      const currentUrl = window.location.href.split('?')[0];
      localStorage.setItem('facebookRedirectUrl', currentUrl);
      
      // Redirect to Facebook OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error initiating Facebook connection:", error);
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to Facebook",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const hasValidConnection = connections.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Facebook className="h-5 w-5 text-facebook" />
          <span>Facebook Ads Integration</span>
        </CardTitle>
        <CardDescription>
          Connect your Facebook Ads account to create and manage campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-facebook"></div>
          </div>
        ) : hasValidConnection ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium text-sm mb-1">Connected Account</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {connections[0].account_name} (ID: {connections[0].account_id})
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={connectFacebook}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-facebook mr-2"></div>
                    Reconnecting...
                  </>
                ) : (
                  "Reconnect"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="w-full bg-facebook hover:bg-facebook/90 text-white"
            onClick={connectFacebook}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <Facebook className="h-4 w-4 mr-2" />
                Connect to Facebook Ads
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default FacebookConnect;
