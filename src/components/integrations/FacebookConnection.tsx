
import { useState, useEffect } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Facebook, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  PlatformConnection,
  AdAccount,
  FacebookPage,
  PlatformConnectionMetadata,
} from "@/types/platformConnection";
import { Badge } from "@/components/ui/badge";

interface FacebookConnectionProps {
  onConnectionChange: () => void;
}

export default function FacebookConnection({ onConnectionChange }: FacebookConnectionProps) {
  const [connection, setConnection] = useState<PlatformConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const session = useSession();
  const { toast } = useToast();

  useEffect(() => {
    if (session) {
      fetchConnection();
    }
  }, [session]);

  const fetchConnection = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("platform_connections")
        .select("*")
        .eq("platform", "facebook")
        .single();

      if (error) throw error;

      // Transform the data to ensure metadata is correctly typed
      const typedConnection: PlatformConnection = {
        ...data,
        metadata: data.metadata as PlatformConnectionMetadata
      };

      setConnection(typedConnection);
    } catch (error) {
      console.error("Error fetching Facebook connection:", error);
      toast({
        title: "Error",
        description: "Failed to load Facebook connection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAccount = async (accountId: string) => {
    if (!connection) return;
    
    try {
      setIsUpdating(true);
      
      // Create a properly typed metadata object
      const updatedMetadata: PlatformConnectionMetadata = {
        ...(connection.metadata || {}),
        selected_account_id: accountId,
        ad_accounts: connection.metadata?.ad_accounts || [],
        pages: connection.metadata?.pages || [],
        last_fetched: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('platform_connections')
        .update({
          metadata: updatedMetadata
        })
        .eq('id', connection.id);
        
      if (error) throw error;
      
      // Update local state
      setConnection({
        ...connection,
        metadata: updatedMetadata
      });
      
      toast({
        title: "Account Updated",
        description: "Your selected ad account has been updated",
      });
    } catch (error) {
      console.error("Error updating account selection:", error);
      toast({
        title: "Failed to Update",
        description: "There was an error updating your selected account",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const selectedAccountId = connection?.metadata?.selected_account_id || '';
  const adAccounts = connection?.metadata?.ad_accounts || [];

  const handleDisconnect = async () => {
    if (!connection) return;

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from("platform_connections")
        .delete()
        .eq("id", connection.id);

      if (error) throw error;

      setConnection(null);
      onConnectionChange();
      toast({
        title: "Disconnected",
        description: "Your Facebook account has been disconnected",
      });
    } catch (error) {
      console.error("Error disconnecting Facebook:", error);
      toast({
        title: "Failed to Disconnect",
        description: "There was an error disconnecting your Facebook account",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!connection) {
    const facebookOAuthURL = `${
      import.meta.env.VITE_SUPABASE_URL
    }/auth/v1/authorize?provider=facebook&redirect_to=${
      window.location.origin
    }/integrations?connection=facebook`;

    return (
      <div className="space-y-4">
        <Alert>
          <Facebook className="h-4 w-4" />
          <AlertTitle>Connect Facebook</AlertTitle>
          <AlertDescription>
            Connect your Facebook account to automate ad creation.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <a href={facebookOAuthURL}>Connect Facebook</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Facebook className="h-4 w-4" />
        <AlertTitle>Facebook Connected</AlertTitle>
        <AlertDescription>
          Your Facebook account is connected. Manage your ad accounts and
          pages below.
        </AlertDescription>
      </Alert>

      <Separator className="my-4" />

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Ad Accounts</h4>
        {connection.metadata?.ad_accounts && connection.metadata.ad_accounts.length > 0 ? (
          <div className="grid gap-2">
            {connection.metadata.ad_accounts.map((account: AdAccount) => (
              <Button
                key={account.id}
                variant={connection.metadata?.selected_account_id === account.id ? "default" : "outline"}
                onClick={() => handleSelectAccount(account.id)}
                disabled={isUpdating}
              >
                {account.name}
                {connection.metadata?.selected_account_id === account.id && (
                  <CheckCircle className="ml-2 h-4 w-4" />
                )}
              </Button>
            ))}
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertTitle>No Ad Accounts Found</AlertTitle>
            <AlertDescription>
              No ad accounts were found for your Facebook account. Please check
              your Facebook account settings.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Separator className="my-4" />

      <Button
        variant="destructive"
        onClick={handleDisconnect}
        disabled={isUpdating}
      >
        Disconnect Facebook
      </Button>
    </div>
  );
}
