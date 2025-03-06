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

export default function PlatformIntegrations() {
  const [activeTab, setActiveTab] = useState("integrations");
  const [hasConnections, setHasConnections] = useState(false);
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
                toast({
                  title: "Success!",
                  description: response.data.message || "Your Facebook Ads account has been connected",
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

    // Only run the OAuth callback if we have a session and are on the integrations page
    if (session && location.pathname === '/integrations') {
      processOAuthCallback();
    }
  }, [session, location.search, navigate, toast, location.pathname]);

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
        .select('platform')
        .limit(1);
      
      if (error) {
        console.error("Error checking connections:", error);
        setHasConnections(false);
      } else {
        const hasAnyConnection = data && data.length > 0;
        console.log("Has connections:", hasAnyConnection, data);
        setHasConnections(hasAnyConnection);
        
        // If we have connections and the user is on the integrations tab,
        // we can show the campaigns tab by default
        if (hasAnyConnection && activeTab === "integrations") {
          setActiveTab("campaigns");
        }
      }
    } catch (error) {
      console.error("Exception checking connections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle connection changes - refresh the connection status
  const handleConnectionChange = () => {
    checkConnections();
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
              <FacebookConnection onConnectionChange={handleConnectionChange} />
              
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
          ) : (
            <FacebookCampaignOverview />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
