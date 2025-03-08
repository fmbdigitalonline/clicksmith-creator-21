
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import FacebookConnection from "./FacebookConnection";
import FacebookCampaignOverview from "./FacebookCampaignOverview";
import EnvConfigCheck from "./EnvConfigCheck";
import { AutomaticModeMonitoring } from "./AutomaticModeMonitoring";

export default function PlatformIntegrations() {
  const [activeTab, setActiveTab] = useState<string>("facebook");
  const location = useLocation();

  // Check if we're on a nested route
  const isMonitoringRoute = location.pathname.includes('/campaign/') && location.pathname.includes('/monitoring');
  const isCampaignRoute = location.pathname.includes('/campaign/');
  
  // Extract campaign ID if available
  const campaignId = isCampaignRoute ? 
    location.pathname.split('/campaign/')[1]?.split('/')[0] : 
    undefined;

  return (
    <div className="container pb-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Ad Platform Integrations</CardTitle>
          <CardDescription>
            Connect your ad accounts and manage campaigns across platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnvConfigCheck />
        </CardContent>
      </Card>

      <Routes>
        <Route 
          path="/" 
          element={
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="facebook">Facebook</TabsTrigger>
                <TabsTrigger value="google" disabled>Google Ads</TabsTrigger>
                <TabsTrigger value="tiktok" disabled>TikTok</TabsTrigger>
              </TabsList>
              
              <TabsContent value="facebook">
                <div className="space-y-6">
                  <FacebookConnection />
                  <FacebookCampaignOverview />
                </div>
              </TabsContent>
              
              <TabsContent value="google">
                <Card>
                  <CardHeader>
                    <CardTitle>Google Ads Integration</CardTitle>
                    <CardDescription>Connect your Google Ads account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center py-10 text-muted-foreground">
                      Google Ads integration coming soon
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tiktok">
                <Card>
                  <CardHeader>
                    <CardTitle>TikTok Ads Integration</CardTitle>
                    <CardDescription>Connect your TikTok Ads account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center py-10 text-muted-foreground">
                      TikTok Ads integration coming soon
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          } 
        />
        
        {/* Campaign monitoring route */}
        <Route 
          path="/campaign/:campaignId/monitoring" 
          element={
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Campaign Monitoring</h2>
                <Link to="/integrations" className="text-sm text-blue-600 hover:underline">
                  Back to Campaigns
                </Link>
              </div>
              <AutomaticModeMonitoring campaignId={campaignId} />
            </div>
          } 
        />
      </Routes>
    </div>
  );
}
