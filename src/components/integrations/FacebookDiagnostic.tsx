
import { useState, useEffect } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle, AlertTriangle, Info, Loader2, Facebook } from "lucide-react";
import { PlatformConnection } from "@/types/platformConnection";

/**
 * A diagnostic component to check the Facebook integration status
 */
export default function FacebookDiagnostic() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<Record<string, any>>({});
  const [connection, setConnection] = useState<PlatformConnection | null>(null);
  const [envVariables, setEnvVariables] = useState<Record<string, boolean>>({});
  const session = useSession();

  useEffect(() => {
    if (session) {
      checkEnvironmentVariables();
      checkConnectionStatus();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  // Check if required environment variables are set
  const checkEnvironmentVariables = async () => {
    try {
      // We can't directly access env variables client-side,
      // so we'll infer from available configuration
      const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
      const redirectUri = import.meta.env.VITE_FACEBOOK_REDIRECT_URI;
      
      setEnvVariables({
        VITE_FACEBOOK_APP_ID: !!facebookAppId,
        VITE_FACEBOOK_REDIRECT_URI: !!redirectUri,
      });
      
      console.log("Client environment variables:", {
        VITE_FACEBOOK_APP_ID: !!facebookAppId,
        VITE_FACEBOOK_REDIRECT_URI: !!redirectUri,
      });
    } catch (error) {
      console.error("Error checking environment variables:", error);
    }
  };

  // Check connection status
  const checkConnectionStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('platform', 'facebook')
        .maybeSingle();

      if (error) {
        console.error("Error fetching connection:", error);
      }
      
      setConnection(data as PlatformConnection);
      console.log("Connection data:", data);
    } catch (error) {
      console.error("Error checking connection status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Run diagnostic tests
  const runDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    const results: Record<string, any> = {};
    
    try {
      // 1. Check Edge Functions
      const edgeFunctionsResult = await checkEdgeFunctions();
      results.edgeFunctions = edgeFunctionsResult;
      
      // 2. Check Token Status
      if (connection) {
        const tokenResult = await checkTokenStatus(connection);
        results.token = tokenResult;
      } else {
        results.token = { status: "error", message: "No Facebook connection found" };
      }
      
      // 3. Check Campaign Feature
      const campaignFeatureResult = await checkCampaignFeature();
      results.campaignFeature = campaignFeatureResult;
      
      // 4. Check Database Schema
      const schemaResult = await checkDatabaseSchema();
      results.schema = schemaResult;
      
      setDiagnosticResults(results);
    } catch (error) {
      console.error("Error running diagnostics:", error);
      setDiagnosticResults({
        error: {
          status: "error",
          message: "Error running diagnostic tests",
          details: error
        }
      });
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  // Check if edge functions are responsive
  const checkEdgeFunctions = async () => {
    try {
      // Let's try a simple call to the facebook-oauth function
      const response = await supabase.functions.invoke("facebook-oauth", {
        method: "OPTIONS"
      });
      
      if (response.error) {
        return {
          status: "warning",
          message: "Edge function responded with an error",
          details: response.error
        };
      }
      
      return {
        status: "success",
        message: "Edge functions are responsive"
      };
    } catch (error) {
      return {
        status: "error",
        message: "Failed to connect to edge functions",
        details: error
      };
    }
  };

  // Check token status
  const checkTokenStatus = async (connection: PlatformConnection) => {
    if (!connection.access_token) {
      return {
        status: "error",
        message: "No access token found in connection"
      };
    }
    
    if (connection.token_expires_at) {
      const expiryDate = new Date(connection.token_expires_at);
      if (expiryDate < new Date()) {
        return {
          status: "error",
          message: "Access token has expired",
          expiryDate: expiryDate.toISOString()
        };
      }
    }
    
    // Check metadata
    if (!connection.metadata) {
      return {
        status: "warning",
        message: "Connection metadata is missing"
      };
    }
    
    // Check ad accounts
    if (!connection.metadata.ad_accounts || connection.metadata.ad_accounts.length === 0) {
      return {
        status: "warning",
        message: "No ad accounts found in connection metadata"
      };
    }
    
    // Check selected account
    if (!connection.metadata.selected_account_id) {
      return {
        status: "warning",
        message: "No selected ad account in connection metadata"
      };
    }
    
    return {
      status: "success",
      message: "Access token is valid",
      accountsCount: connection.metadata.ad_accounts?.length || 0,
      pagesCount: connection.metadata.pages?.length || 0,
      selectedAccount: connection.metadata.selected_account_id
    };
  };

  // Check campaign feature
  const checkCampaignFeature = async () => {
    try {
      // Check if campaigns table exists by querying it
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("count()")
        .eq("platform", "facebook")
        .single();
      
      if (error) {
        return {
          status: "warning",
          message: "Could not query ad_campaigns table",
          details: error
        };
      }
      
      return {
        status: "success",
        message: "Campaign feature is available",
        campaignCount: data.count
      };
    } catch (error) {
      return {
        status: "error",
        message: "Failed to check campaign feature",
        details: error
      };
    }
  };

  // Check database schema
  const checkDatabaseSchema = async () => {
    try {
      // We can indirectly check schema by querying for a specific field
      // Query platform_connections to ensure metadata exists
      const { data, error } = await supabase
        .from("platform_connections")
        .select("metadata")
        .eq("platform", "facebook")
        .maybeSingle();
      
      if (error) {
        return {
          status: "warning",
          message: "Could not query platform_connections metadata field",
          details: error
        };
      }
      
      // Check if metadata field exists and is not null
      if (data && 'metadata' in data) {
        return {
          status: "success",
          message: "Database schema includes metadata field"
        };
      } else {
        return {
          status: "error",
          message: "Database schema is missing metadata field"
        };
      }
    } catch (error) {
      return {
        status: "error",
        message: "Failed to check database schema",
        details: error
      };
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <Check className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="outline" className="bg-green-50 text-green-700">Success</Badge>;
      case "warning":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700">Warning</Badge>;
      case "error":
        return <Badge variant="outline" className="bg-red-50 text-red-700">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Facebook className="w-5 h-5 mr-2" /> Facebook Integration Diagnostic
          </CardTitle>
          <CardDescription>
            Checking Facebook integration status...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Facebook className="w-5 h-5 mr-2" /> Facebook Integration Diagnostic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please sign in to run Facebook integration diagnostics.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Facebook className="w-5 h-5 mr-2" /> Facebook Integration Diagnostic
        </CardTitle>
        <CardDescription>
          Check the status of your Facebook integration components
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Environment Variables */}
        <div>
          <h3 className="text-lg font-medium mb-2">Environment Variables</h3>
          <div className="space-y-2">
            {Object.entries(envVariables).map(([key, exists]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center">
                  {exists ? (
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span>{key}</span>
                </div>
                <Badge variant="outline" className={exists ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}>
                  {exists ? "Configured" : "Missing"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* Connection Status */}
        <div>
          <h3 className="text-lg font-medium mb-2">Facebook Connection</h3>
          {connection ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Name:</span>
                <span className="font-medium">{connection.account_name || "Not set"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connected on:</span>
                <span className="font-medium">{new Date(connection.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Token Expires:</span>
                <span className="font-medium">
                  {connection.token_expires_at 
                    ? new Date(connection.token_expires_at).toLocaleDateString() 
                    : "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ad Accounts:</span>
                <span className="font-medium">
                  {connection.metadata?.ad_accounts?.length || 0} accounts
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pages:</span>
                <span className="font-medium">
                  {connection.metadata?.pages?.length || 0} pages
                </span>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not Connected</AlertTitle>
              <AlertDescription>
                No Facebook connection found. Please connect your Facebook account first.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <Separator />
        
        {/* Diagnostic Results */}
        {Object.keys(diagnosticResults).length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Diagnostic Results</h3>
            <div className="space-y-4">
              {Object.entries(diagnosticResults).map(([key, result]) => (
                <div key={key} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center">
                      {getStatusIcon(result.status)}
                      <span className="ml-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </h4>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  {result.details && (
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={runDiagnostic} 
          disabled={isRunningDiagnostic || !connection}
          className="w-full"
        >
          {isRunningDiagnostic ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Diagnostic...
            </>
          ) : (
            "Run Diagnostic Tests"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
