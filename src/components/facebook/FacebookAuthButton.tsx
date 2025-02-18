
import { Button } from "@/components/ui/button";
import { Facebook } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const FACEBOOK_CLIENT_ID = import.meta.env.VITE_FACEBOOK_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/facebook-callback`;

export function FacebookAuthButton() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleConnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to connect your Facebook account",
          variant: "destructive",
        });
        return;
      }

      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${FACEBOOK_CLIENT_ID}&` +
        `redirect_uri=${REDIRECT_URI}&` +
        `state=${user.id}&` +
        `scope=ads_management,ads_read`;

      window.location.href = authUrl;
    } catch (error) {
      console.error('Facebook auth error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Facebook. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      onClick={handleConnect}
      className="w-full flex items-center gap-2"
    >
      <Facebook className="h-4 w-4" />
      Connect Facebook Ads
    </Button>
  );
}
