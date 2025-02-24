
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Facebook } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const PlatformSettings = () => {
  const { toast } = useToast();

  const { data: connection, isLoading } = useQuery({
    queryKey: ['meta-connection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('platform', 'facebook')
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleMetaConnect = async () => {
    // Meta OAuth flow
    const appId = '599504683060636';
    const redirectUri = `${window.location.origin}/settings`;
    const scope = 'ads_management,business_management';
    
    const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}`;
    
    window.location.href = url;
  };

  const handleMetaDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('platform_connections')
        .delete()
        .eq('platform', 'facebook');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Meta account disconnected successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect Meta account",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Facebook className="h-5 w-5" />
          <CardTitle>Connected Accounts</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Meta Business Account</h3>
            <p className="text-sm text-muted-foreground">
              {connection ? `Connected as ${connection.account_name}` : 'Not connected'}
            </p>
          </div>
          <Button
            variant={connection ? "destructive" : "default"}
            onClick={connection ? handleMetaDisconnect : handleMetaConnect}
            disabled={isLoading}
          >
            {connection ? "Disconnect" : "Connect"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
