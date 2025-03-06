import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FacebookConnection from "@/components/integrations/FacebookConnection";
import FacebookCampaignOverview from "@/components/integrations/FacebookCampaignOverview";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Info, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useLocation, useNavigate } from "react-router-dom";

// Define an extended interface that includes the metadata field
interface ExtendedPlatformConnection {
  id: string;
  platform: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  account_id: string | null;
  account_name: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  // Store extended data in this field
  extendedData?: {
    adAccounts?: Array<{id: string; name: string; account_id?: string; status?: number}>;
    pages?: Array<{id: string; name: string; category?: string; access_token?: string}>;
    selectedAdAccountId?: string;
    selectedPageId?: string;
    pageAccessToken?: string;
  };
}

export default function PlatformIntegrations() {
  const [activeTab, setActiveTab] = useState("integrations");
  const [hasConnections, setHasConnections] = useState(false);
  const [connections, setConnections] = useState<ExtendedPlatformConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const session = useSession();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Process OAuth callback if present in URL
  useEffect(() => {
    const processOAuthCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      const connectionType = searchParams.get('connection');
      const error = searchParams.get('error');
      const errorReason = searchParams.get('error_reason');
      const errorDescription = searchParams.get('error_description');
      
      if (!connectionType) return;
      
      console.log("Detected OAuth callback:", { 
        connectionType, 
        code: code ? 'present' : 'missing',
        error: error || 'none',
        errorReason: errorReason || 'none',
        errorDescription: errorDescription || 'none'
      });
      
      if (error) {
        // Clean URL parameters but stay on the integrations page
        navigate('/integrations', { replace: true });
        
        const errorMsg = errorDescription || `Failed to connect to ${connectionType}`;
        setOauthError(errorMsg);
        
        toast({
          title: "Connection Failed",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }
      
      if (connectionType === 'facebook' && code) {
        setIsProcessingOAuth(true);
        setOauthError(null);
        
        try {
          console.log("Processing Facebook OAuth callback...");
          
          // Wait a moment to ensure auth token is available
          // This helps prevent issues with the session being unavailable
          setTimeout(async () => {
            try {
              // Get current session to ensure we have a valid token
              const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
              
              if (sessionError || !sessionData.session) {
                throw new Error("No valid session available. Please log in again.");
              }
              
              // Clean URL parameters but stay on the integrations page
              navigate('/integrations', { replace: true });
              
              const authToken = sessionData.session.access_token;
              
              // Call the function with the code and authorization token
              const response = await supabase.functions.invoke('facebook-oauth', {
                body: { code },
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              });
  
              console.log("OAuth function response:", response);
  
              if (response.error) {
                throw new Error(response.error);
              }
  
              if (response.data && response.data.success) {
                const accountsFound = response.data.accountsFound || 0;
                const message = accountsFound > 0 
                  ? `Your Facebook Ads account has been connected with ${accountsFound} ad account${accountsFound > 1 ? 's' : ''}`
                  : "Your Facebook account has been connected, but no ad accounts were found.";
                  
                toast({
                  title: "Success!",
                  description: message,
                });
                
                // Force reload connections
                await checkConnections();
                setActiveTab("campaigns");
              } else {
                throw new Error(response.data?.message || response.data?.error || "Unknown error occurred");
              }
            } catch (delayedError) {
              console.error("Error in delayed processing:", delayedError);
              const errorMessage = delayedError instanceof Error ? delayedError.message : "Failed to connect to Facebook";
              setOauthError(errorMessage);
              
              toast({
                title: "Connection Failed",
                description: errorMessage,
                variant: "destructive",
              });
            } finally {
              setIsProcessingOAuth(false);
            }
          }, 1000); // Short delay to ensure session is established
        } catch (error) {
          console.error("Error processing OAuth callback:", error);
          const errorMessage = error instanceof Error ? error.message : "Failed to connect to Facebook";
          setOauthError(errorMessage);
          
          toast({
            title: "Connection Failed",
            description: errorMessage,
            variant: "destructive",
          });
          setIsProcessingOAuth(false);
        }
      }
    };

    if (session) {
      processOAuthCallback();
    }
  }, [session, location.search, navigate, toast]);

  // Check if any platform is connected
  const checkConnections = async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }
    
    try {
      console.log("Checking for any platform connections...");
      const { data, error } = await supabase
        .from('platform_connections')
        .select('*');
      
      if (error) {
        console.error("Error checking connections:", error);
        setHasConnections(false);
        setConnections([]);
      } else {
        const hasAnyConnection = data && data.length > 0;
        console.log("Has connections:", hasAnyConnection, data);
        
        // Process the connections to extract extended data
        const processedConnections = data ? data.map(conn => {
          // If the connection has a metadata field (stored as JSON in the database)
          const extendedData = (conn as any).metadata ? {
            adAccounts: (conn as any).metadata.adAccounts || [],
            pages: (conn as any).metadata.pages || [],
            selectedAdAccountId: (conn as any).metadata.selectedAdAccountId || null,
            selectedPageId: (conn as any).metadata.selectedPageId || null,
            pageAccessToken: (conn as any).metadata.pageAccessToken || null
          } : undefined;
          
          // Return the connection with the extended data
          return {
            ...conn,
            extendedData
          } as ExtendedPlatformConnection;
        }) : [];
        
        setHasConnections(hasAnyConnection);
        setConnections(processedConnections);
        
        // If we have connections and the user is on the integrations tab,
        // we can show the campaigns tab by default
        if (hasAnyConnection && activeTab === "integrations") {
          setActiveTab("campaigns");
        }
      }
    } catch (error) {
      console.error("Exception checking connections:", error);
      setConnections([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check connections on mount and when session changes
  useEffect(() => {
    checkConnections();
  }, [session]);

  if (isLoading || isProcessingOAuth) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Integrations</h1>
          <p className="text-muted-foreground">
            Connect your ad accounts to automate campaign creation.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="w-8 h-8 mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {isProcessingOAuth ? "Processing your connection..." : "Loading connections..."}
          </p>
        </div>
      </div>
    );
  }

  // Find Facebook connection if exists
  const facebookConnection = connections.find(conn => conn.platform === 'facebook');
  const hasFacebookAdAccounts = facebookConnection?.extendedData?.adAccounts?.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Integrations</h1>
        <p className="text-muted-foreground">
          Connect your ad accounts to automate campaign creation.
        </p>
      </div>

      {oauthError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Failed</AlertTitle>
          <AlertDescription>
            {oauthError}
            {oauthError.includes("redirect") && (
              <div className="mt-2">
                <strong>Important:</strong> Make sure to add{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded">{window.location.origin}/integrations?connection=facebook</code>{" "}
                as a valid OAuth Redirect URI in your Facebook App settings.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Connect Platforms</TabsTrigger>
          <TabsTrigger value="campaigns">Create Campaigns</TabsTrigger>
        </TabsList>
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ad Platform Connections</CardTitle>
              <CardDescription>
                Connect your advertising accounts to automate ad creation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FacebookConnection onConnectionChange={checkConnections} />
              
              <Separator className="my-6" />
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>More platforms coming soon</AlertTitle>
                <AlertDescription>
                  We're working on adding Google Ads, TikTok Ads, and other platforms.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="campaigns" className="space-y-4">
          {!hasConnections && !isLoading ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Connected Platforms</AlertTitle>
              <AlertDescription>
                You need to connect at least one ad platform before creating campaigns.
              </AlertDescription>
            </Alert>
          ) : hasFacebookAdAccounts ? (
            <FacebookCampaignOverview />
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Ad Accounts Found</AlertTitle>
              <AlertDescription>
                We couldn't find any ad accounts associated with your Facebook connection. 
                Please make sure you have at least one Facebook Ads account and reconnect.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
