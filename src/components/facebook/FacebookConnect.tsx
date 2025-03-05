
import { Button } from "@/components/ui/button";
import { Facebook, Check, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FacebookConnectProps {
  onConnected?: () => void;
}

export const FacebookConnect = ({ onConnected }: FacebookConnectProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [accountName, setAccountName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Check if already connected to Facebook
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: connections } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'facebook')
        .maybeSingle();

      if (connections && connections.access_token) {
        setIsConnected(true);
        setAccountName(connections.account_name || "Facebook Account");
      }
    } catch (error) {
      console.error("Error checking Facebook connection:", error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Generate random state for CSRF protection
      const state = Math.random().toString(36).substring(2, 15);
      
      // Store state in localStorage for verification
      localStorage.setItem('facebook_auth_state', state);
      
      // Get redirect URL from edge function
      const { data, error } = await supabase.functions.invoke('facebook-auth', {
        body: { action: 'get_auth_url', state },
      });
      
      if (error) throw error;
      
      // Redirect to Facebook login
      window.location.href = data.authUrl;
    } catch (error) {
      console.error("Error connecting to Facebook:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Facebook. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call edge function to revoke token
      await supabase.functions.invoke('facebook-auth', {
        body: { action: 'disconnect' },
      });

      // Delete from database
      await supabase
        .from('platform_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', 'facebook');

      setIsConnected(false);
      setAccountName("");

      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Facebook.",
      });
    } catch (error) {
      console.error("Error disconnecting from Facebook:", error);
      toast({
        title: "Error",
        description: "Could not disconnect from Facebook.",
        variant: "destructive",
      });
    }
  };

  if (isConnected) {
    return (
      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-500" />
          <span>Connected to <span className="font-medium">{accountName}</span></span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">Facebook connection required</p>
          <p className="text-xs text-muted-foreground">
            To publish ads, you need to connect your Facebook Ad account
          </p>
        </div>
      </div>

      <Button
        variant="facebook"
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center gap-2"
      >
        <Facebook className="h-4 w-4" />
        {isConnecting ? "Connecting..." : "Connect Facebook Account"}
      </Button>
    </div>
  );
};
