
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Facebook, 
  Check, 
  AlertCircle, 
  Loader2, 
  ChevronDown, 
  ExternalLink,
  RefreshCw,
  Building2,
  BookOpen
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  PlatformConnection, 
  AdAccount, 
  FacebookPage, 
  PlatformConnectionMetadata, 
  validatePlatformConnectionMetadata 
} from "@/types/platformConnection";

// URL redirecting to Facebook OAuth with environment variables and expanded permissions
const generateFacebookAuthURL = () => {
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
  
  if (!facebookAppId) {
    console.error("Missing Facebook App ID in environment variables");
    return "";
  }
  
  // Get the current origin, handling both preview and production URLs
  const currentOrigin = window.location.origin;
  const redirectUri = `${currentOrigin}/integrations?connection=facebook`;
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  
  // Include enhanced permissions for Ads Manager access with image capabilities
  const scopes = encodeURIComponent("ads_management,ads_read,business_management,pages_read_engagement,pages_show_list,ads_images:read,ads_images:write");
  
  // Generate a secure state parameter with timestamp and random value for CSRF protection
  const stateValue = JSON.stringify({
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(2, 15),
    origin: currentOrigin
  });
  
  // Store state in sessionStorage for verification when returning from OAuth
  sessionStorage.setItem('facebookOAuthState', stateValue);
  
  const encodedState = encodeURIComponent(stateValue);
  
  console.log("Generating Facebook Auth URL with:", {
    currentOrigin,
    redirectUri,
    state: stateValue
  });
  
  return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${facebookAppId}&redirect_uri=${encodedRedirectUri}&scope=${scopes}&response_type=code&state=${encodedState}`;
};

interface FacebookConnectionProps {
  onConnectionChange?: () => void;
}

export default function FacebookConnection({ onConnectionChange }: FacebookConnectionProps) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [connection, setConnection] = useState<PlatformConnection | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const { toast } = useToast();
  const session = useSession();

  // Enhanced connection validation
  const fetchConnectionStatus = async () => {
    if (!session) {
      setIsLoading(false);
      return false;
    }
    
    try {
      console.log("Checking Facebook connection status...");
      const { data, error } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('platform', 'facebook')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error validating connection:", error);
        return false;
      }
      
      // Check if token is expired
      if (data && data.token_expires_at) {
        const expiryDate = new Date(data.token_expires_at);
        if (expiryDate < new Date()) {
          console.log("Facebook token has expired", data);
          toast({
            title: "Connection Expired",
            description: "Your Facebook connection has expired. Please reconnect.",
            variant: "destructive",
          });
          return false;
        }
      }
      
      console.log("Facebook connection data:", data);
      if (data) {
        // Safely process metadata
        let processedData = { ...data };
        
        if (data.metadata) {
          processedData.metadata = validatePlatformConnectionMetadata(data.metadata);
        }
        
        setConnection(processedData as PlatformConnection);
        
        // Set the selected account ID if available in metadata
        if (processedData.metadata) {
          const metadata = processedData.metadata as PlatformConnectionMetadata;
          if (metadata.selected_account_id) {
            setSelectedAccountId(metadata.selected_account_id);
          } else if (data.account_id) {
            setSelectedAccountId(data.account_id);
          }
          
          // Set the selected page ID if available in metadata
          if (metadata.selected_page_id) {
            setSelectedPageId(metadata.selected_page_id);
          } else if (metadata.pages && metadata.pages.length > 0) {
            // Default to the first page if available
            setSelectedPageId(metadata.pages[0].id);
          }
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error validating connection:", error);
      return false;
    }
  };

  // Check connection status
  useEffect(() => {
    async function checkConnectionStatus() {
      if (!session) {
        setIsLoading(false);
        return;
      }
      
      try {
        const isConnected = await fetchConnectionStatus();
        setIsConnected(isConnected);
      } catch (error) {
        console.error("Error checking connection status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkConnectionStatus();
    
    // Add session state change handler
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed in Facebook connection:", event);
      if (event === 'SIGNED_IN') {
        checkConnectionStatus();
      } else if (event === 'SIGNED_OUT') {
        setIsConnected(false);
        setConnection(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [session, toast]);

  // Handle OAuth callback in the URL - improved with state validation
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      const state = params.get('state');
      
      if (error) {
        const errorMsg = params.get('error_description') || `Authentication error: ${params.get('error_reason') || error}`;
        setErrorMessage(errorMsg);
        toast({
          title: "Connection Failed",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }
      
      // Validate state parameter if present (CSRF protection)
      if (state) {
        try {
          const storedState = sessionStorage.getItem('facebookOAuthState');
          if (!storedState) {
            console.warn("No stored OAuth state found for validation");
          } else {
            // Parse and validate state
            const parsedState = JSON.parse(decodeURIComponent(state));
            const parsedStoredState = JSON.parse(storedState);
            
            // Check if state is valid (matches stored state)
            if (parsedState.nonce !== parsedStoredState.nonce) {
              setErrorMessage("Invalid OAuth state - possible CSRF attack");
              toast({
                title: "Security Warning",
                description: "Authentication state mismatch detected. Please try again.",
                variant: "destructive",
              });
              return;
            }
            
            // Check if state is expired (older than 1 hour)
            const stateTime = new Date(parsedState.timestamp);
            const currentTime = new Date();
            const hourInMs = 60 * 60 * 1000;
            
            if (currentTime.getTime() - stateTime.getTime() > hourInMs) {
              setErrorMessage("OAuth state expired - please try again");
              toast({
                title: "Authentication Expired",
                description: "Your authentication request has expired. Please try again.",
                variant: "destructive",
              });
              return;
            }
            
            // Clear the stored state after validation
            sessionStorage.removeItem('facebookOAuthState');
          }
        } catch (e) {
          console.error("Error validating OAuth state:", e);
        }
      }
    };
    
    handleOAuthCallback();
  }, [toast]);

  // Handle connection click with improved state management
  const handleConnect = () => {
    setErrorMessage(null);
    setIsProcessing(true);
    
    try {
      const authUrl = generateFacebookAuthURL();
      if (!authUrl) {
        setErrorMessage("Facebook App ID is missing in configuration.");
        toast({
          title: "Configuration Error",
          description: "Facebook App ID is missing. Please check your environment variables.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      // Enhanced logging for debugging
      console.log("Facebook connection details:", {
        appId: import.meta.env.VITE_FACEBOOK_APP_ID ? "configured" : "missing",
        redirectUri: import.meta.env.VITE_FACEBOOK_REDIRECT_URI,
        authUrl: authUrl
      });
      
      // Navigate user to Facebook auth flow
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error initiating Facebook connection:", error);
      setErrorMessage("Failed to connect to Facebook. Please try again.");
      setIsProcessing(false);
    }
  };

  // Handle disconnection
  const handleDisconnect = async () => {
    if (!session) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('platform_connections')
        .delete()
        .eq('platform', 'facebook');

      if (error) {
        throw error;
      }

      setIsConnected(false);
      setConnection(null);
      setSelectedAccountId(null);
      setSelectedPageId(null);
      
      toast({
        title: "Disconnected",
        description: "Your Facebook Ads account has been disconnected",
      });
      
      if (onConnectionChange) {
        onConnectionChange();
      }
    } catch (error) {
      console.error("Error disconnecting account:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect your account",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Refresh ad accounts and pages
  const handleRefreshAccounts = async () => {
    if (!session || !connection) return;
    
    setIsRefreshing(true);
    try {
      // Call our OAuth endpoint with a special refresh parameter
      const response = await fetch('/api/facebook-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ refresh: true })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refresh accounts');
      }
      
      // Refresh the connection data
      await fetchConnectionStatus();
      
      toast({
        title: "Accounts Refreshed",
        description: "Your Facebook ad accounts and pages have been refreshed",
      });
    } catch (error) {
      console.error("Error refreshing accounts:", error);
      toast({
        title: "Error",
        description: "Failed to refresh ad accounts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle account selection
  const handleAccountSelection = async (accountId: string) => {
    if (!session || !connection) return;
    
    try {
      // Find the account details
      const metadata = connection.metadata as PlatformConnectionMetadata;
      const selectedAccount = metadata?.ad_accounts?.find(account => account.id === accountId);
      
      if (!selectedAccount) {
        throw new Error("Selected account not found");
      }
      
      // Update the platform_connection in the database
      const { error } = await supabase
        .from('platform_connections')
        .update({
          account_id: accountId,
          account_name: selectedAccount.name,
          metadata: {
            ...metadata,
            selected_account_id: accountId
          } as PlatformConnectionMetadata
        })
        .eq('platform', 'facebook');
      
      if (error) throw error;
      
      // Update local state
      setSelectedAccountId(accountId);
      setConnection({
        ...connection,
        account_id: accountId,
        account_name: selectedAccount.name,
        metadata: {
          ...metadata,
          selected_account_id: accountId
        } as PlatformConnectionMetadata
      });
      
      toast({
        title: "Account Selected",
        description: `Now using "${selectedAccount.name}" for Facebook Ads`,
      });
      
      if (onConnectionChange) {
        onConnectionChange();
      }
    } catch (error) {
      console.error("Error setting account:", error);
      toast({
        title: "Error",
        description: "Failed to set selected account",
        variant: "destructive",
      });
    }
  };
  
  // Handle page selection
  const handlePageSelection = async (pageId: string) => {
    if (!session || !connection || !connection.metadata) return;
    
    try {
      // Find the page details
      const metadata = connection.metadata as PlatformConnectionMetadata;
      const selectedPage = metadata?.pages?.find(page => page.id === pageId);
      
      if (!selectedPage) {
        throw new Error("Selected page not found");
      }
      
      // Update the platform_connection in the database
      const { error } = await supabase
        .from('platform_connections')
        .update({
          metadata: {
            ...metadata,
            selected_page_id: pageId
          } as PlatformConnectionMetadata
        })
        .eq('platform', 'facebook');
      
      if (error) throw error;
      
      // Update local state
      setSelectedPageId(pageId);
      setConnection({
        ...connection,
        metadata: {
          ...metadata,
          selected_page_id: pageId
        } as PlatformConnectionMetadata
      });
      
      toast({
        title: "Page Selected",
        description: `Now using "${selectedPage.name}" for Facebook Ads`,
      });
      
      if (onConnectionChange) {
        onConnectionChange();
      }
    } catch (error) {
      console.error("Error setting page:", error);
      toast({
        title: "Error",
        description: "Failed to set selected page",
        variant: "destructive",
      });
    }
  };

  // Create campaign
  const handleCreateCampaign = async () => {
    toast({
      title: "Campaign Creation",
      description: "Campaign creation feature is under development",
    });
    
    // This will be expanded in future phases
    setShowDetails(!showDetails);
  };

  // Format account status
  const formatAccountStatus = (status: number) => {
    switch (status) {
      case 1: return { label: "Active", color: "bg-green-100 text-green-800" };
      case 2: return { label: "Disabled", color: "bg-red-100 text-red-800" };
      case 3: return { label: "Unsettled", color: "bg-yellow-100 text-yellow-800" };
      case 7: return { label: "Pending Review", color: "bg-blue-100 text-blue-800" };
      case 9: return { label: "In Grace Period", color: "bg-orange-100 text-orange-800" };
      default: return { label: "Unknown", color: "bg-gray-100 text-gray-800" };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Facebook className="w-5 h-5 mr-2" /> Facebook Ads
          </CardTitle>
          <CardDescription>Connect your Facebook Ads account</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Facebook className="w-5 h-5 mr-2" /> Facebook Ads
          </CardTitle>
          {isConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Check className="w-3 h-3 mr-1" /> Connected
            </Badge>
          )}
        </div>
        <CardDescription>
          Connect your Facebook Ads account to create and manage campaigns
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {errorMessage}
              {errorMessage.includes("Missing") && (
                <div className="mt-2">
                  <p className="text-sm">Please check if:</p>
                  <ul className="list-disc list-inside text-sm ml-2 mt-1">
                    <li>Your Facebook App ID is correct in the .env file</li>
                    <li>Your Facebook Redirect URI is correct in the .env file</li>
                    <li>The Facebook App has the exact same Redirect URI in its settings</li>
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      
        {isConnected && connection ? (
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Account:</span>
              <span className="font-medium">{connection.account_name || 'Default Account'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Connected on:</span>
              <span className="font-medium">
                {new Date(connection.created_at).toLocaleDateString()}
              </span>
            </div>
            
            {connection.metadata && connection.metadata.ad_accounts && connection.metadata.ad_accounts.length > 0 && (
              <div className="pt-2">
                <label className="text-sm font-medium mb-1 block">
                  Select Ad Account
                </label>
                <div className="flex gap-2">
                  <Select 
                    value={selectedAccountId || undefined} 
                    onValueChange={handleAccountSelection}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select ad account" />
                    </SelectTrigger>
                    <SelectContent>
                      {connection.metadata.ad_accounts.map(account => {
                        const status = formatAccountStatus(account.account_status);
                        return (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex justify-between items-center w-full">
                              <span>{account.name}</span>
                              <Badge variant="outline" className={status.color}>
                                {status.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleRefreshAccounts}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {connection.metadata.ad_accounts.length} ad account{connection.metadata.ad_accounts.length !== 1 ? 's' : ''} available
                </p>
              </div>
            )}
            
            {/* Pages Selector */}
            {connection.metadata && connection.metadata.pages && connection.metadata.pages.length > 0 ? (
              <div className="pt-2">
                <label className="text-sm font-medium mb-1 block">
                  Select Facebook Page
                </label>
                <div className="flex gap-2">
                  <Select 
                    value={selectedPageId || undefined} 
                    onValueChange={handlePageSelection}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Facebook page" />
                    </SelectTrigger>
                    <SelectContent>
                      {connection.metadata.pages.map(page => (
                        <SelectItem key={page.id} value={page.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{page.name}</span>
                            {page.category && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {page.category}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {connection.metadata.pages.length} Facebook page{connection.metadata.pages.length !== 1 ? 's' : ''} available
                </p>
              </div>
            ) : (
              <Alert variant="default" className="bg-yellow-50 border-yellow-200 mt-4">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Facebook Page Required</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  You need to connect at least one Facebook Page to create ad campaigns. 
                  Make sure your Facebook account has admin access to a Facebook Page.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Permission Warning */}
            <Alert className="bg-yellow-50 border-yellow-200 mt-4">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Limited Permissions</AlertTitle>
              <AlertDescription className="text-yellow-700">
                <p className="mb-2">
                  Your Facebook App has limited permissions until it passes Facebook App Review. 
                  Some features like image uploads may be restricted.
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <a 
                    href="https://developers.facebook.com/docs/app-review"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-blue-600 hover:underline"
                  >
                    <BookOpen className="h-3 w-3 mr-1" /> Learn about Facebook App Review
                  </a>
                </div>
              </AlertDescription>
            </Alert>
            
            {/* Expanded details */}
            <Collapsible open={showDetails} onOpenChange={setShowDetails} className="mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="flex items-center justify-between w-full mt-2">
                  <span>Ad Campaign Details</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4 p-4 border rounded-md">
                <div className="space-y-2">
                  <h4 className="font-medium">Campaign Status</h4>
                  <p className="text-sm text-muted-foreground">
                    Create a new Facebook ad campaign from your saved ad creatives. 
                    You'll be able to review and edit all details before the campaign goes live.
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateCampaign}
                  disabled={isProcessing}
                >
                  Create Campaign
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-4">
              Connect your Facebook Ads account to automate ad creation and campaign management directly from this dashboard.
            </p>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important Facebook Setup</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>Make sure your Facebook App settings include <strong>{window.location.origin}/integrations?connection=facebook</strong> as a valid OAuth redirect URI.</p>
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <p>Current environment configuration:</p>
                </div>
                <div className="text-xs bg-muted p-2 rounded overflow-auto">
                  <p>App ID: {import.meta.env.VITE_FACEBOOK_APP_ID ? import.meta.env.VITE_FACEBOOK_APP_ID : "Not configured"}</p>
                  <p>Redirect URI: {import.meta.env.VITE_FACEBOOK_REDIRECT_URI || "Not configured"}</p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <a 
                    href="https://developers.facebook.com/apps/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-blue-600 hover:underline"
                  >
                    Facebook Developers Console <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {isConnected ? (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleDisconnect}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Disconnecting...
              </>
            ) : (
              'Disconnect Account'
            )}
          </Button>
        ) : (
          <Button 
            className="w-full" 
            onClick={handleConnect}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Facebook Ads'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
