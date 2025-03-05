
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FaFacebook } from "react-icons/fa";
import { Check, AlertCircle } from "lucide-react";
import { useFacebookIntegration } from "@/hooks/useFacebookIntegration";

interface FacebookConnectProps {
  onConnected?: () => void;
}

export function FacebookConnect({ onConnected }: FacebookConnectProps) {
  const { isConnecting, connectionStatus, connectToFacebook, checkFacebookConnection } = useFacebookIntegration();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      await checkFacebookConnection();
      setChecked(true);
    };
    
    checkConnection();
  }, [checkFacebookConnection]);

  const handleConnect = async () => {
    const success = await connectToFacebook();
    if (success && onConnected) {
      onConnected();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FaFacebook className="text-[#1877F2] mr-2" />
          Facebook Connection
        </CardTitle>
        <CardDescription>
          Connect to your Facebook Ads account to publish your ads directly from our platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!checked ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Checking connection status...</span>
          </div>
        ) : connectionStatus === "connected" ? (
          <div className="flex items-center text-green-600 p-4 bg-green-50 rounded-md">
            <Check className="mr-2" />
            <span>Connected to Facebook Ads</span>
          </div>
        ) : connectionStatus === "error" ? (
          <div className="flex items-center text-red-600 p-4 bg-red-50 rounded-md">
            <AlertCircle className="mr-2" />
            <span>There was an error with your Facebook connection. Please reconnect.</span>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-md">
            <p>You need to connect to Facebook Ads to publish your ads directly from our platform.</p>
            <ul className="list-disc ml-5 mt-2 text-sm text-gray-600">
              <li>Publish your ads with one click</li>
              <li>Manage your ad campaigns</li>
              <li>Track performance metrics</li>
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleConnect} 
          className="w-full"
          variant="facebook"
          disabled={isConnecting || connectionStatus === "connected"}
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="ml-2">Connecting...</span>
            </>
          ) : connectionStatus === "connected" ? (
            <>
              <Check className="mr-2" />
              Connected
            </>
          ) : (
            <>
              <FaFacebook className="mr-2" />
              Connect to Facebook Ads
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
