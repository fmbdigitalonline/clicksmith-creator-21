
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { useNavigate } from "react-router-dom";

export const useFacebookIntegration = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"not_connected" | "connected" | "error">("not_connected");
  const { toast } = useToast();
  const { checkCredits } = useCredits();
  const navigate = useNavigate();

  // Check if user has connected to Facebook
  const checkFacebookConnection = async () => {
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

      setConnectionStatus("connected");
      return true;
    } catch (error) {
      console.error("Error checking Facebook connection:", error);
      setConnectionStatus("error");
      return false;
    }
  };

  // Connect to Facebook - this is a placeholder for the actual OAuth flow
  const connectToFacebook = async () => {
    try {
      setIsConnecting(true);
      
      // First check if user has enough credits
      const hasCredits = await checkCredits(5); // Publishing to Facebook costs 5 credits
      
      if (!hasCredits) {
        navigate('/pricing');
        return false;
      }
      
      // TODO: Implement actual Facebook OAuth flow using a Supabase Edge Function
      toast({
        title: "Not yet implemented",
        description: "Facebook integration is coming soon!",
        variant: "default",
      });
      
      setIsConnecting(false);
      return false;
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

  // Publish ads to Facebook - this is a placeholder for the actual implementation
  const publishToFacebook = async (projectId: string, adVariants: any[]) => {
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
      
      // TODO: Implement actual Facebook ad publishing using a Supabase Edge Function
      toast({
        title: "Not yet implemented",
        description: "Facebook ad publishing is coming soon!",
        variant: "default",
      });
      
      setIsPublishing(false);
      return false;
    } catch (error) {
      console.error("Error publishing to Facebook:", error);
      toast({
        title: "Publishing Error",
        description: "Failed to publish ads to Facebook. Please try again.",
        variant: "destructive",
      });
      setIsPublishing(false);
      return false;
    }
  };

  return {
    isConnecting,
    isPublishing,
    connectionStatus,
    checkFacebookConnection,
    connectToFacebook,
    publishToFacebook,
  };
};
