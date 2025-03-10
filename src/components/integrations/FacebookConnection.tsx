
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdAccount } from '@/types/platformConnection';

export default function FacebookConnection() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [connection, setConnection] = useState<any>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [hasPagesConnected, setHasPagesConnected] = useState(false);

  // Fetch connection
  useEffect(() => {
    if (!user?.id) return;

    async function fetchConnection() {
      try {
        const { data, error } = await supabase
          .from('platform_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform', 'facebook')
          .maybeSingle();

        if (error) {
          console.error('Error fetching connection:', error);
          return;
        }

        setConnection(data);
        
        if (data?.metadata?.ad_accounts) {
          setAdAccounts(data.metadata.ad_accounts);
        }
        
        if (data?.metadata?.selected_account_id) {
          setSelectedAccountId(data.metadata.selected_account_id);
        } else if (data?.metadata?.ad_accounts?.length > 0) {
          setSelectedAccountId(data.metadata.ad_accounts[0].account_id);
        }
        
        // Check if user has any pages connected
        setHasPagesConnected(data?.metadata?.pages && data.metadata.pages.length > 0);
      } catch (error) {
        console.error('Error fetching connection:', error);
      }
    }

    fetchConnection();
  }, [user?.id]);

  // Connect to Facebook
  const handleConnect = async () => {
    try {
      setLoading(true);
      
      // Open popup window for oauth flow
      const width = 600;
      const height = 700;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;
      
      const popup = window.open(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-oauth`,
        'Connect to Facebook',
        `width=${width},height=${height},top=${top},left=${left}`
      );
      
      if (!popup) {
        throw new Error('Popup blocked. Please enable popups for this site.');
      }
      
      // Listen for success message from popup
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'FACEBOOK_OAUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          toast.success('Connected to Facebook');
          // Reload the page to refresh the connection state
          window.location.reload();
        }
      };
      
      window.addEventListener('message', handleMessage);
      
    } catch (error: any) {
      toast.error(`Failed to connect: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Update selected account ID
  const handleAccountSelect = async (accountId: string) => {
    try {
      setSelectedAccountId(accountId);
      
      const { error } = await supabase
        .from('platform_connections')
        .update({
          account_id: accountId,
          metadata: {
            ...connection.metadata,
            selected_account_id: accountId
          }
        })
        .eq('user_id', user?.id)
        .eq('platform', 'facebook');
      
      if (error) {
        throw error;
      }
      
      toast.success('Ad account updated');
    } catch (error: any) {
      toast.error(`Failed to update account: ${error.message}`);
    }
  };

  // Disconnect from Facebook
  const handleDisconnect = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('platform_connections')
        .delete()
        .eq('user_id', user?.id)
        .eq('platform', 'facebook');
      
      if (error) {
        throw error;
      }
      
      setConnection(null);
      setAdAccounts([]);
      setSelectedAccountId(null);
      
      toast.success('Disconnected from Facebook');
    } catch (error: any) {
      toast.error(`Failed to disconnect: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facebook</CardTitle>
        <CardDescription>
          Connect your Facebook account to create and manage ad campaigns
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {connection ? (
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </div>
              <div>
                <div className="font-medium">Connected</div>
                <div className="text-sm text-gray-500">
                  {new Date(connection.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {adAccounts.length > 0 && (
              <div className="pt-2">
                <label className="block text-sm font-medium mb-1">
                  Select Ad Account
                </label>
                <Select value={selectedAccountId || ''} onValueChange={handleAccountSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select ad account" />
                  </SelectTrigger>
                  <SelectContent>
                    {adAccounts.map((account) => (
                      <SelectItem key={account.account_id} value={account.account_id}>
                        {account.name} ({account.account_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!hasPagesConnected && (
              <Alert variant="warning" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No Facebook Pages Connected</AlertTitle>
                <AlertDescription>
                  You need to connect at least one Facebook Page to create ads. 
                  Please disconnect and reconnect your Facebook account with page permissions.
                </AlertDescription>
              </Alert>
            )}
            
            <Alert className="mt-4">
              <AlertTitle>About Facebook Permissions</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  To fully utilize ad creation, your Facebook app requires these permissions:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>ads_management - For creating and managing ad campaigns</li>
                  <li>pages_show_list - For accessing your Facebook pages</li>
                  <li>ads_images:read and ads_images:write - For uploading ad images</li>
                </ul>
                <p className="mt-2 text-sm">
                  Some features may require App Review by Facebook before full functionality is available.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="mb-4">Connect your Facebook account to create ad campaigns</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        {connection ? (
          <Button variant="destructive" onClick={handleDisconnect} disabled={loading}>
            Disconnect
          </Button>
        ) : (
          <Button onClick={handleConnect} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
