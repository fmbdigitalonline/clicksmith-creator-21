
import { useState, useEffect } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";

interface FacebookConnection {
  id: string;
  platform: string;
  access_token: string;
  account_id: string | null;
  account_name: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useFacebookConnection() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connection, setConnection] = useState<FacebookConnection | null>(null);
  const session = useSession();

  useEffect(() => {
    async function checkConnectionStatus() {
      if (!session) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('platform_connections')
          .select('*')
          .eq('platform', 'facebook')
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { // not_found error
            console.error("Error fetching Facebook connection:", error);
          }
        } else if (data) {
          // Check token expiration
          if (data.token_expires_at) {
            const expiryDate = new Date(data.token_expires_at);
            if (expiryDate < new Date()) {
              console.log("Facebook connection has expired");
              setIsConnected(false);
              setConnection(null);
              setIsLoading(false);
              return;
            }
          }
          
          setIsConnected(true);
          setConnection(data);
        }
      } catch (error) {
        console.error("Error checking Facebook connection status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkConnectionStatus();
  }, [session]);

  return { isConnected, isLoading, connection };
}
