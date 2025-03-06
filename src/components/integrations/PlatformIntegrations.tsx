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
import { 
  FacebookOAuthResponse, 
  FacebookOAuthResponseSchema,
  isValidFacebookOAuthResponse, 
  validatePlatformConnectionMetadata 
} from "@/types/platformConnection";

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

  // Process OAuth callback if present in URL - improved with transaction handling and state validation
  useEffect(() => {
    const processOAuthCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      const connectionType = searchParams.get('connection');
      const error = searchParams.get('error');
      const errorReason = searchParams.get('error_reason');
      const errorDescription = searchParams.get('error_description');
      const state = searchParams.get('state');
      
      if (!connectionType) return;
      
      console.log("Detected OAuth callback:", { 
        connectionType, 
        code: code ? `present (${code.length} chars)` : 'missing',
        error: error || 'none',
        errorReason: errorReason || 'none',
        errorDescription: errorDescription || 'none',
        statePresent: state ? 'yes' : 'no'
      });
      
      if (error) {
        // Keep error parameters for rendering but reset other params to avoid infinite loops
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('code');
        cleanUrl.searchParams.delete('state');
        navigate('/integrations', { 
          replace: true,
          state: { 
            error, 
            errorReason, 
            errorDescription 
          }
        });
        
        const errorMsg = errorDescription || `Failed to connect to ${connectionType}`;
        setOauthError(errorMsg);
        
        toast({
          title: "Connection Failed",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }
      
      // Validate state parameter for security
      if (state) {
        try {
          const storedState = sessionStorage.getItem(`${connectionType}OAuthState`);
          if (!storedState) {
            console.warn(`No stored OAuth state found for ${connectionType}`);
          } else {
            // Parse and validate state
            let parsedState;
            let parsedStoredState;
            
            try {
              parsedState = JSON.parse(decodeURIComponent(state));
              parsedStoredState = JSON.parse(storedState);
            } catch (e) {
              console.error("Error parsing state:", e);
              throw new Error("Invalid state format");
            }
            
            // Check if state is valid (matches stored state)
            if (parsedState.nonce !== parsedStoredState.nonce) {
              throw new Error("State mismatch - possible CSRF attack");
            }
            
            // Check if state is expired (older than 1 hour)
            const stateTime = new Date(parsedState.timestamp);
            const currentTime = new Date();
            const hourInMs = 60 * 60 * 1000;
            
            if (currentTime.getTime() - stateTime.getTime() > hourInMs) {
              throw new Error("OAuth state expired");
            }
            
            // Verify origin matches the current origin
            if (parsedState.origin && parsedState.origin !== window.location.origin) {
              throw new Error("Origin mismatch in state");
            }
            
            // Clear the stored state after validation
            sessionStorage.removeItem(`${connectionType}OAuthState`);
          }
        } catch (e) {
          console.error("Error validating OAuth state:", e);
          
          // Clean URL and navigate away to avoid infinite loops
          navigate('/integrations', { 
            replace: true,
            state: { 
              error: "authentication_error", 
              errorDescription: e instanceof Error ? e.message : "Invalid authentication state" 
            }
          });
          
          setOauthError("Security validation failed: " + (e instanceof Error ? e.message : "Unknown error"));
          
          toast({
            title: "Security Warning",
            description: "Authentication validation failed. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }
      
      if (connectionType === 'facebook' && code) {
        setIsProcessingOAuth(true);
        setOauthError(null);
        
        try {
          console.log("Processing Facebook OAuth callback with code:", code.substring(0, 5) + '...');
          
          if (!session) {
            throw new Error("No active session found. Please log in again.");
          }
          
          console.log("Current session found, using access token for API call");
          
          // Clean URL parameters immediately to prevent accidental refreshes
          // Store the code in memory for processing
          const codeToProcess = code;
          navigate('/integrations', { replace: true });
          
          // Add a transaction tracking variable for rollback capability
          let transactionStage = 'init';
          
          try {
            // Call the edge function with the code and authorization token
            transactionStage = 'api_call';
            
            // Improve resilience with retry logic
            const maxRetries = 2;
            let retryCount = 0;
            let response;
            
            while (retryCount <= maxRetries) {
              try {
                response = await supabase.functions.invoke('facebook-oauth', {
                  body: { 
                    code: codeToProcess,
                    origin: window.location.origin,
                    state: state // Pass state for additional verification on server
                  },
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                  },
                });
                
                break; // Break out of retry loop if successful
              } catch (retryError) {
                if (retryCount === maxRetries) {
                  throw retryError; // Rethrow if we've exhausted retries
                }
                
                console.log(`API call attempt ${retryCount + 1} failed, retrying...`);
                retryCount++;
                // Exponential backoff
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount)));
              }
            }

            console.log("OAuth function response:", response);
            
            if (response.error) {
              throw new Error(response.error.message || response.error);
            }

            // Validate response structure
            transactionStage = 'validation';
            if (!isValidFacebookOAuthResponse(response.data)) {
              throw new Error("Invalid response format from server");
            }

            const oauthResponse = response.data as FacebookOAuthResponse;
            
            // Extra validation check with zod
            try {
              FacebookOAuthResponseSchema.parse(oauthResponse);
            } catch (error) {
              console.error("Schema validation failed for OAuth response:", error);
              throw new Error("Server response failed schema validation");
            }
            
            if (oauthResponse.success) {
              transactionStage = 'success';
              
              // Validate metadata before proceeding
              if (oauthResponse.adAccounts) {
                console.log(`Validating ${oauthResponse.adAccounts.length} ad accounts`);
                // Log any validation issues but don't fail
                try {
                  validatePlatformConnectionMetadata({
                    ad_accounts: oauthResponse.adAccounts,
                    pages: oauthResponse.pages || []
                  });
                } catch (error) {
                  console.warn("Metadata validation issue:", error);
                }
              }
              
              toast({
                title: "Success!",
                description: oauthResponse.message || "Your Facebook Ads account has been connected",
              });
              
              // Force reload connections
              await checkConnections();
              setActiveTab("campaigns");
            } else {
              const errorMessage = oauthResponse.error || oauthResponse.message || "Unknown error occurred connecting to Facebook";
              throw new Error(errorMessage);
            }
          } catch (error) {
            console.error(`Error in transaction stage: ${transactionStage}`, error);
            
            // If we reached the validation or success stage, attempt rollback
            if (transactionStage === 'validation' || transactionStage === 'success') {
              try {
                console.log("Attempting rollback of partially completed connection");
                // Attempt to delete the platform connection if it was created
                const { error: deleteError } = await supabase
                  .from('platform_connections')
                  .delete()
                  .eq('platform', 'facebook');
                
                if (deleteError) {
                  console.error("Error rolling back connection:", deleteError);
                } else {
                  console.log("Successfully rolled back connection");
                }
              } catch (rollbackError) {
                console.error("Error during rollback:", rollbackError);
              }
            }
            
            throw error;
          }
        } catch (error) {
          console.error("Error processing OAuth callback:", error);
          const errorMessage = error instanceof Error ? error.message : "Failed to connect to Facebook";
          setOauthError(errorMessage);
          
          toast({
            title: "Connection Failed",
            description: errorMessage,
            variant: "destructive",
          });
        } finally {
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
        .select('platform, metadata')
        .limit(1);
      
      if (error) {
        console.error("Error checking connections:", error);
        setHasConnections(false);
      } else {
        const hasAnyConnection = data && data.length > 0;
        console.log("Has connections:", hasAnyConnection, data);

        // Validate metadata in each connection
        if (hasAnyConnection && data[0].metadata) {
          try {
            const validatedMetadata = validatePlatformConnectionMetadata(data[0].metadata);
            console.log("Connection metadata validated:", validatedMetadata);
          } catch (error) {
            console.warn("Connection has invalid metadata:", error);
          }
        }
                
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
          <AlertDescription className="space-y-2">
            <p>{oauthError}</p>
            {oauthError.includes("redirect") && (
              <div className="mt-2">
                <strong>Important:</strong> Make sure to add{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded">{window.location.origin}/integrations?connection=facebook</code>{" "}
                as a valid OAuth Redirect URI in your Facebook App settings.
              </div>
            )}
            {oauthError.includes("token") && (
              <div className="mt-2">
                <strong>Authentication Error:</strong> There was a problem with your session token.
                Try logging out and back in, then retry the connection.
              </div>
            )}
            {oauthError.includes("configuration") && (
              <div className="mt-2">
                <strong>Server Configuration Error:</strong> The server is missing required configuration for Facebook integration.
                Please check that all required environment variables are set.
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
