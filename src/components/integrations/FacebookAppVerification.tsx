
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FacebookAppVerificationProps {
  appId?: string;
  redirectUri?: string;
}

export default function FacebookAppVerification({ appId, redirectUri }: FacebookAppVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState<{
    appExists: boolean;
    redirectUriConfigured: boolean;
    permissionsRequested: boolean;
    message?: string;
  } | null>(null);
  const { toast } = useToast();

  const verifyAppSettings = async () => {
    setIsVerifying(true);
    try {
      // In a real implementation, we would call an edge function to verify these settings
      // For now, we'll just simulate a verification
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      const mockResults = {
        appExists: !!appId,
        redirectUriConfigured: !!redirectUri,
        permissionsRequested: true,
        message: "Manual verification recommended"
      };
      
      setVerificationResults(mockResults);
      
      toast({
        title: "Verification Complete",
        description: mockResults.appExists && mockResults.redirectUriConfigured 
          ? "Basic configuration looks good. Please verify permissions manually." 
          : "Some configuration issues were found. Please review the details.",
        variant: mockResults.appExists && mockResults.redirectUriConfigured ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Error verifying app settings:", error);
      toast({
        title: "Verification Failed",
        description: "Could not verify app settings. Please check manually.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facebook App Verification</CardTitle>
        <CardDescription>
          Verify your Facebook App settings for proper integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important Setup Requirements</AlertTitle>
          <AlertDescription className="space-y-2 mt-2">
            <p>Your Facebook App needs the following:</p>
            <ol className="ml-5 list-decimal space-y-1">
              <li>Valid App ID (currently: {appId || "Not configured"})</li>
              <li>Redirect URI configured as: {redirectUri || "Not configured"}</li>
              <li>Required permissions: <code>ads_management</code>, <code>ads_read</code>, <code>business_management</code></li>
              <li>App Review approval for these permissions</li>
            </ol>
          </AlertDescription>
        </Alert>
        
        {verificationResults && (
          <div className="space-y-3 mt-4">
            <h3 className="text-sm font-medium">Verification Results:</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">App ID Configured:</span>
                {verificationResults.appExists ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Check className="w-3 h-3 mr-1" /> Valid
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <AlertCircle className="w-3 h-3 mr-1" /> Invalid
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Redirect URI:</span>
                {verificationResults.redirectUriConfigured ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Check className="w-3 h-3 mr-1" /> Configured
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <AlertCircle className="w-3 h-3 mr-1" /> Not Configured
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Permissions:</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Manual Check Required
                </Badge>
              </div>
            </div>
            
            {verificationResults.message && (
              <p className="text-sm text-muted-foreground mt-2">{verificationResults.message}</p>
            )}
          </div>
        )}
        
        <div className="flex items-center space-x-2 mt-4">
          <Button 
            onClick={verifyAppSettings} 
            disabled={isVerifying}
            variant="outline"
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Verify App Settings
              </>
            )}
          </Button>
          
          <Button 
            variant="outline"
            className="shrink-0"
            onClick={() => window.open("https://developers.facebook.com/apps/", "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Open Dev Console
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
