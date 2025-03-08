
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FacebookConnection from "./FacebookConnection";
import EnvConfigCheck from "./EnvConfigCheck";
import { useSearchParams } from "react-router-dom";
import FacebookAppVerification from "./FacebookAppVerification";
import FacebookPermissionsGuide from "./FacebookPermissionsGuide";

export default function PlatformIntegrations() {
  const [activeTab, setActiveTab] = useState("facebook");
  const [searchParams] = useSearchParams();
  const connectionParam = searchParams.get('connection');

  useEffect(() => {
    // Set the active tab based on the URL parameter if it exists
    if (connectionParam) {
      setActiveTab(connectionParam);
    }
  }, [connectionParam]);

  // Get environment variables for Facebook verification
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
  const redirectUri = `${window.location.origin}/integrations?connection=facebook`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Integrations</h1>
        <p className="text-muted-foreground">
          Connect your ad accounts to create and manage campaigns directly from this dashboard.
        </p>
      </div>

      <EnvConfigCheck />

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="facebook">Facebook Ads</TabsTrigger>
          <TabsTrigger value="google" disabled>Google Ads (Coming Soon)</TabsTrigger>
          <TabsTrigger value="tiktok" disabled>TikTok Ads (Coming Soon)</TabsTrigger>
        </TabsList>

        <TabsContent value="facebook" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <FacebookConnection onConnectionChange={() => {}} />
              <FacebookPermissionsGuide />
            </div>
            <div className="space-y-4">
              <FacebookAppVerification appId={facebookAppId} redirectUri={redirectUri} />
              <Card>
                <CardHeader>
                  <CardTitle>Environment Configuration</CardTitle>
                  <CardDescription>Current environment variables for Facebook integration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">App ID:</span>
                      <span className="text-sm text-muted-foreground">{facebookAppId || "Not configured"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Redirect URI:</span>
                      <span className="text-sm text-muted-foreground text-right break-all">{redirectUri}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="google">
          <Card>
            <CardHeader>
              <CardTitle>Google Ads Integration</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Google Ads integration will be available in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiktok">
          <Card>
            <CardHeader>
              <CardTitle>TikTok Ads Integration</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p>TikTok Ads integration will be available in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
